import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

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

/**
 * Draws the 21-landmark hand skeleton with glowing cyan and violet theme
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  mirrored: boolean = true
) {
  if (!landmarks || landmarks.length === 0) return;

  const getCanvasCoords = (lm: NormalizedLandmark) => {
    // If mirrored, flip horizontally to match mirror camera
    const x = mirrored ? (1 - lm.x) * width : lm.x * width;
    const y = lm.y * height;
    return { x, y };
  };

  ctx.save();

  // Draw connections (bones)
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = getCanvasCoords(landmarks[startIdx]);
    const end = getCanvasCoords(landmarks[endIdx]);

    // Gradient between Cyan (#22D3EE) and Violet (#8B5CF6)
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, '#22D3EE');
    gradient.addColorStop(1, '#8B5CF6');

    // Glow effect
    ctx.shadowColor = '#22D3EE';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // Reset shadow for joints
  ctx.shadowBlur = 0;

  // Draw landmark points (joints)
  landmarks.forEach((lm, index) => {
    const { x, y } = getCanvasCoords(lm);
    const isTip = FINGERTIPS.includes(index);
    const isWrist = index === 0;

    ctx.beginPath();
    if (isTip) {
      // Glow on fingertips
      ctx.shadowColor = '#8B5CF6';
      ctx.shadowBlur = 12;
      ctx.arc(x, y, 6.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#C084FC'; // brighter violet
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    } else if (isWrist) {
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#22D3EE';
      ctx.fill();
    } else {
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#22D3EE';
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#E0F2FE';
      ctx.fill();
    }
  });

  ctx.restore();
}

