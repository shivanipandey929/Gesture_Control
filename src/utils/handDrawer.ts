import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { CANVAS_THEME } from '../constants/themeColors';
import { mapCameraPointToArena } from './coordinateMapping';

export const HAND_CONNECTIONS: [number, number][] = [
  // Wrist & Palm base
  [0, 1],
  [0, 5],
  [5, 9],
  [9, 13],
  [13, 17],
  [0, 17],
  // Thumb
  [1, 2],
  [2, 3],
  [3, 4],
  // Index Finger
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle Finger
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring Finger
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky Finger
  [17, 18],
  [18, 19],
  [19, 20],
];

const FINGERTIPS = [4, 8, 12, 16, 20];

// History ring buffer for fading swipe / motion trails
const trailHistory: { x: number; y: number; time: number }[] = [];

export interface SkeletonOptions {
  mirrored?: boolean;
  gestureLabel?: string;
  confidence?: number;
  style?: 'Clean' | 'Glow';
}

/**
 * Gesture specific colour palette as required:
 * - Open Palm: green (#22c55e)
 * - Closed Fist: amber (#f59e0b)
 * - Pointing: blue (#3b82f6)
 * - Victory: violet (#8b5cf6)
 * - Thumb Up: teal (#14b8a6)
 * - Thumb Down: red (#ef4444)
 * - Pinch: cyan (#06b6d4)
 * - neutral / no gesture: neutral (#94a3b8)
 */
export function getGestureColor(gesture?: string): { hex: string; rgb: string } {
  if (!gesture || gesture === 'None') {
    return { hex: '#94a3b8', rgb: '148, 163, 184' };
  }
  const clean = gesture.toLowerCase().replace(/[\s_-]/g, '');
  if (clean.includes('openpalm') || clean.includes('palm')) {
    return { hex: '#22c55e', rgb: '34, 197, 94' };
  }
  if (clean.includes('closedfist') || clean.includes('fist')) {
    return { hex: '#f59e0b', rgb: '245, 158, 11' };
  }
  if (clean.includes('pointing') || clean.includes('click')) {
    return { hex: '#3b82f6', rgb: '59, 130, 246' };
  }
  if (clean.includes('victory') || clean.includes('scissors')) {
    return { hex: '#8b5cf6', rgb: '139, 92, 246' };
  }
  if (clean.includes('thumbup')) {
    return { hex: '#14b8a6', rgb: '20, 184, 166' };
  }
  if (clean.includes('thumbdown')) {
    return { hex: '#ef4444', rgb: '239, 68, 68' };
  }
  if (clean.includes('pinch')) {
    return { hex: '#06b6d4', rgb: '6, 182, 212' };
  }
  return { hex: '#38bdf8', rgb: '56, 189, 248' };
}

/**
 * Determines whether a finger index (0..4) is extended
 */
function isFingerExtended(fingerIdx: number, lms: NormalizedLandmark[]): boolean {
  if (!lms || lms.length < 21) return false;
  const wrist = lms[0];
  const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

  if (fingerIdx === 0) {
    // Thumb: tip (4) vs MCP (2)
    return dist(lms[4], wrist) > dist(lms[2], wrist) * 1.15;
  }
  const tipIdx = [8, 12, 16, 20][fingerIdx - 1];
  const pipIdx = [6, 10, 14, 18][fingerIdx - 1];
  return dist(lms[tipIdx], wrist) > dist(lms[pipIdx], wrist) * 1.15;
}

/**
 * Upgraded drawHandSkeleton:
 * - Bones as thin white lines
 * - Joints filled with gesture colour
 * - Extended fingers filled more brightly than folded ones
 * - Larger glowing fingertips (radial gradient)
 * - Corner brackets around hand bounding box
 * - Gesture chip next to wrist with name and confidence
 * - Soft palm ring and fading trail preserved
 * - GPU friendly (no expensive shadowBlur)
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  mirrored: boolean = true,
  gestureLabel?: string,
  confidence: number = 0,
  style: 'Clean' | 'Glow' = 'Glow',
  showGestureChip: boolean = true,
  videoDimensions?: { width: number; height: number; objectFit?: 'cover' | 'contain' }
) {
  if (!landmarks || landmarks.length === 0) {
    trailHistory.length = 0;
    return;
  }

  const getCanvasCoords = (lm: { x: number; y: number }) => {
    if (videoDimensions && videoDimensions.width > 0 && videoDimensions.height > 0) {
      const pt = mapCameraPointToArena(lm.x, lm.y, {
        boxWidth: width,
        boxHeight: height,
        videoWidth: videoDimensions.width,
        videoHeight: videoDimensions.height,
        objectFit: videoDimensions.objectFit || 'cover',
        mirrored,
      });
      return { x: pt.x, y: pt.y };
    }
    const x = mirrored ? (1 - lm.x) * width : lm.x * width;
    const y = lm.y * height;
    return { x, y };
  };

  const now = Date.now();
  const wristCoords = getCanvasCoords(landmarks[0]);
  trailHistory.push({ x: wristCoords.x, y: wristCoords.y, time: now });
  while (trailHistory.length > 0 && (now - trailHistory[0].time > 350 || trailHistory.length > 10)) {
    trailHistory.shift();
  }

  ctx.save();

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const gestureColorInfo = getGestureColor(gestureLabel);
  const activeColor = gestureLabel && gestureLabel !== 'None' ? gestureColorInfo.hex : (isDark ? CANVAS_THEME.skeleton.jointColor : CANVAS_THEME.primary);
  const boneColor = 'rgba(255, 255, 255, 0.9)';
  const ringColor = `rgba(${gestureColorInfo.rgb}, 0.45)`;
  const trailRgb = gestureColorInfo.rgb;

  // 1. Draw fading motion trail
  if (trailHistory.length > 2) {
    for (let i = 1; i < trailHistory.length; i++) {
      const p1 = trailHistory[i - 1];
      const p2 = trailHistory[i];
      const progress = i / trailHistory.length;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(${trailRgb}, ${(progress * 0.45).toFixed(2)})`;
      ctx.lineWidth = 1.5 + progress * 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  const thumbTip = getCanvasCoords(landmarks[4]);
  const indexTip = getCanvasCoords(landmarks[8]);
  const wrist = wristCoords;
  const middleMcp = getCanvasCoords(landmarks[9]);
  const handSpan = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);

  // 2. Corner brackets around hand bounding box
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const lm of landmarks) {
    const pt = getCanvasCoords(lm);
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const pad = 14;
  const bLeft = Math.max(4, minX - pad);
  const bTop = Math.max(4, minY - pad);
  const bRight = Math.min(width - 4, maxX + pad);
  const bBottom = Math.min(height - 4, maxY + pad);
  const cornerLen = Math.min(18, Math.max(10, handSpan * 0.16));

  ctx.save();
  ctx.strokeStyle = `rgba(${gestureColorInfo.rgb}, 0.65)`;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(bLeft, bTop + cornerLen);
  ctx.lineTo(bLeft, bTop);
  ctx.lineTo(bLeft + cornerLen, bTop);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(bRight - cornerLen, bTop);
  ctx.lineTo(bRight, bTop);
  ctx.lineTo(bRight, bTop + cornerLen);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(bLeft, bBottom - cornerLen);
  ctx.lineTo(bLeft, bBottom);
  ctx.lineTo(bLeft + cornerLen, bBottom);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(bRight - cornerLen, bBottom);
  ctx.lineTo(bRight, bBottom);
  ctx.lineTo(bRight, bBottom - cornerLen);
  ctx.stroke();
  ctx.restore();

  // 3. Soft ring around palm when gesture is active
  if (gestureLabel && gestureLabel !== 'None') {
    const palmCenter = {
      x: landmarks[0].x * 0.35 + landmarks[9].x * 0.65,
      y: landmarks[0].y * 0.35 + landmarks[9].y * 0.65,
    };
    const palmPx = getCanvasCoords(palmCenter);
    const ringRadius = Math.max(22, Math.min(55, handSpan * 0.42));

    ctx.beginPath();
    ctx.arc(palmPx.x, palmPx.y, ringRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(palmPx.x, palmPx.y, ringRadius * 0.8, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(${trailRgb}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 4. Draw connections (bones): thin white lines
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = boneColor;

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = getCanvasCoords(landmarks[startIdx]);
    const end = getCanvasCoords(landmarks[endIdx]);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // 5. Dashed line between thumb tip and index tip when pinching
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const pinchRatio = pinchDist / Math.max(1, handSpan);
  if (pinchRatio < 0.35) {
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.moveTo(thumbTip.x, thumbTip.y);
    ctx.lineTo(indexTip.x, indexTip.y);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 6. Draw landmark points (joints) with extension brightness
  const extendedFingers = [
    isFingerExtended(0, landmarks),
    isFingerExtended(1, landmarks),
    isFingerExtended(2, landmarks),
    isFingerExtended(3, landmarks),
    isFingerExtended(4, landmarks),
  ];

  landmarks.forEach((lm, index) => {
    const { x, y } = getCanvasCoords(lm);
    const isTip = FINGERTIPS.includes(index);
    const isWrist = index === 0;

    let fingerIndex = -1;
    if (index >= 1 && index <= 4) fingerIndex = 0;
    else if (index >= 5 && index <= 8) fingerIndex = 1;
    else if (index >= 9 && index <= 12) fingerIndex = 2;
    else if (index >= 13 && index <= 16) fingerIndex = 3;
    else if (index >= 17 && index <= 20) fingerIndex = 4;

    const extended = fingerIndex >= 0 ? extendedFingers[fingerIndex] : true;
    const jointOpacity = extended ? '1.0' : '0.45';

    if (isTip) {
      // Fingertip with radial gradient glow (GPU-friendly)
      const tipRadius = style === 'Glow' ? 7.5 : 5.5;
      if (style === 'Glow') {
        const radGrad = ctx.createRadialGradient(x, y, 1, x, y, tipRadius * 1.8);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.35, activeColor);
        radGrad.addColorStop(1, `rgba(${gestureColorInfo.rgb}, 0)`);
        ctx.beginPath();
        ctx.arc(x, y, tipRadius * 1.8, 0, 2 * Math.PI);
        ctx.fillStyle = radGrad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, tipRadius, 0, 2 * Math.PI);
      ctx.fillStyle = activeColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, tipRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      const radius = isWrist ? 5.5 : 3.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${gestureColorInfo.rgb}, ${jointOpacity})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${extended ? 0.9 : 0.5})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
  });

  // 7. Gesture chip next to wrist with name & confidence (e.g. "Open Palm 91%")
  if (showGestureChip && gestureLabel && gestureLabel !== 'None') {
    const formattedGesture = gestureLabel.replace('_', ' ');
    const confPct = confidence > 0 ? Math.round(confidence * 100) : 92;
    const chipText = `${formattedGesture} ${confPct}%`;

    ctx.save();
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    const textMetrics = ctx.measureText(chipText);
    const chipW = textMetrics.width + 20;
    const chipH = 22;
    const chipX = Math.max(8, Math.min(width - chipW - 8, wrist.x - chipW / 2));
    const chipY = Math.min(height - chipH - 8, wrist.y + 14);

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, 11);
    ctx.fill();

    ctx.strokeStyle = `rgba(${gestureColorInfo.rgb}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Colored indicator dot
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(chipX + 8, chipY + chipH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.fillText(chipText, chipX + 16, chipY + 15);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Hand distance guide: faint rounded frame and text hint when no hand is found
 */
export function drawHandDistanceGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  reason?: string
) {
  ctx.save();
  const boxW = Math.min(width * 0.65, 340);
  const boxH = Math.min(height * 0.75, 280);
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;

  // Faint dashed guide frame
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 20);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corner accents
  const cLen = 20;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(boxX, boxY + cLen);
  ctx.lineTo(boxX, boxY);
  ctx.lineTo(boxX + cLen, boxY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(boxX + boxW - cLen, boxY);
  ctx.lineTo(boxX + boxW, boxY);
  ctx.lineTo(boxX + boxW, boxY + cLen);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(boxX, boxY + boxH - cLen);
  ctx.lineTo(boxX, boxY + boxH);
  ctx.lineTo(boxX + cLen, boxY + boxH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(boxX + boxW - cLen, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH - cLen);
  ctx.stroke();

  // Instruction banner
  const title = 'Position hand inside frame';
  const subtitle = reason ? `(${reason})` : 'Keep hand visible to the camera';

  ctx.font = '600 13px "Space Grotesk", sans-serif';
  const titleMetrics = ctx.measureText(title);
  const bannerW = Math.max(titleMetrics.width + 32, 220);
  const bannerH = 46;
  const bannerX = (width - bannerW) / 2;
  const bannerY = boxY + boxH - 58;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, bannerY + 19);

  ctx.font = '400 11px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(subtitle, width / 2, bannerY + 36);

  ctx.restore();
}
