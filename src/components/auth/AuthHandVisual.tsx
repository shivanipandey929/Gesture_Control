import React, { useEffect, useRef } from 'react';

// 21 Canonical MediaPipe Hand Landmarks for the Hero Holographic Hand
const HAND_LANDMARKS = [
  { x: 190, y: 310 }, // 0: Wrist
  { x: 152, y: 275 }, { x: 125, y: 242 }, { x: 96, y: 210 }, { x: 74, y: 176 },  // 1-4: Thumb
  { x: 152, y: 186 }, { x: 148, y: 148 }, { x: 146, y: 112 }, { x: 145, y: 74 },  // 5-8: Index
  { x: 190, y: 180 }, { x: 190, y: 138 }, { x: 190, y: 98 }, { x: 190, y: 54 },  // 9-12: Middle
  { x: 226, y: 186 }, { x: 230, y: 148 }, { x: 233, y: 112 }, { x: 236, y: 76 },  // 13-16: Ring
  { x: 256, y: 204 }, { x: 263, y: 174 }, { x: 269, y: 146 }, { x: 275, y: 118 }, // 17-20: Pinky
];

// Helper Points for rich internal palm triangulation mesh
const PALM_HELPERS = [
  { x: 190, y: 235 }, // 21: Palm center
  { x: 168, y: 308 }, // 22: Lower wrist left
  { x: 212, y: 308 }, // 23: Lower wrist right
  { x: 138, y: 212 }, // 24: Thumb-index web
  { x: 171, y: 182 }, // 25: Knuckle mid index-middle
  { x: 208, y: 182 }, // 26: Knuckle mid middle-ring
  { x: 241, y: 194 }, // 27: Knuckle mid ring-pinky
  { x: 168, y: 268 }, // 28: Lower-mid palm left
  { x: 212, y: 268 }, // 29: Lower-mid palm right
  { x: 190, y: 206 }, // 30: Upper palm center
  { x: 132, y: 258 }, // 31: Thumb base thenar pad
  { x: 244, y: 252 }, // 32: Pinky outer hypothenar pad
];

const ALL_33_POINTS = [...HAND_LANDMARKS, ...PALM_HELPERS];

// Triangular facets for 3D crystalline mesh
const MESH_TRIANGLES: [number, number, number][] = [
  // Thumb
  [1, 31, 2], [2, 3, 4], [1, 2, 24], [2, 31, 4],
  // Index
  [5, 6, 7], [6, 7, 8], [5, 7, 8],
  // Middle
  [9, 10, 11], [10, 11, 12], [9, 11, 12],
  // Ring
  [13, 14, 15], [14, 15, 16], [13, 15, 16],
  // Pinky
  [17, 18, 19], [18, 19, 20], [17, 19, 20],
  // Finger Webbing
  [5, 6, 25], [6, 10, 25], [9, 10, 25], [9, 10, 26], [10, 14, 26], [13, 14, 26],
  [13, 14, 27], [14, 18, 27], [17, 18, 27],
  // Thumb-to-palm
  [2, 24, 5], [1, 24, 21], [24, 5, 21],
  // Upper palm
  [5, 25, 30], [25, 9, 30], [9, 26, 30], [26, 13, 30], [13, 27, 21], [27, 17, 21],
  [5, 30, 21], [9, 30, 21],
  // Lower & mid palm
  [21, 17, 32], [32, 29, 21], [32, 23, 29], [23, 0, 29], [0, 28, 29], [28, 21, 29],
  [0, 22, 28], [22, 1, 28], [1, 21, 28],
];

// Major bone lines
const BONE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], // Knuckles
];

// Sparkle positions (4-point stars)
const SPARKLES = [
  { x: 55, y: 92, size: 8, delay: 0 },
  { x: 325, y: 104, size: 9, delay: 1.2 },
  { x: 42, y: 215, size: 7, delay: 2.4 },
  { x: 332, y: 252, size: 8, delay: 0.8 },
  { x: 98, y: 300, size: 6, delay: 1.8 },
];

interface AuthHandVisualProps {
  size?: 'normal' | 'compact' | 'mini';
  className?: string;
}

export const AuthHandVisual: React.FC<AuthHandVisualProps> = ({
  size = 'normal',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isRunning = true;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const baseDimension = size === 'mini' ? 240 : size === 'compact' ? 300 : 380;
    const scale = baseDimension / 380;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(baseDimension * dpr);
      canvas.height = Math.floor(baseDimension * dpr);
      canvas.style.width = `${baseDimension}px`;
      canvas.style.height = `${baseDimension}px`;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 10;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 10;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isRunning = true;
        if (!prefersReducedMotion) animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Draw 4-point diamond sparkle star
    const drawSparkle = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.fill();

      // Soft glow center
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.globalAlpha = alpha * 0.85;
      ctx.fill();
      ctx.restore();
    };

    // Draw Viewfinder Corner Brackets
    const drawCornerBrackets = (w: number, h: number, strokeColor: string) => {
      const pad = 16;
      const len = 32;
      const rad = 14;
      const left = pad;
      const top = pad;
      const right = w - pad;
      const bottom = h - pad;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(left, top + len);
      ctx.lineTo(left, top + rad);
      ctx.quadraticCurveTo(left, top, left + rad, top);
      ctx.lineTo(left + len, top);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(right - len, top);
      ctx.lineTo(right - rad, top);
      ctx.quadraticCurveTo(right, top, right, top + rad);
      ctx.lineTo(right, top + len);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(left, bottom - len);
      ctx.lineTo(left, bottom - rad);
      ctx.quadraticCurveTo(left, bottom, left + rad, bottom);
      ctx.lineTo(left + len, bottom);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(right, bottom - len);
      ctx.lineTo(right, bottom - rad);
      ctx.quadraticCurveTo(right, bottom, right - rad, bottom);
      ctx.lineTo(right - len, bottom);
      ctx.stroke();

      ctx.restore();
    };

    // Anatomically proportioned hand silhouette matching reference mockup
    const buildHandPath = (offsetX: number, offsetY: number) => {
      const p = new Path2D();
      // Wrist base line
      p.moveTo(160 + offsetX, 330 + offsetY);
      p.lineTo(220 + offsetX, 330 + offsetY);

      // Pinky edge of palm up to pinky knuckle base
      p.bezierCurveTo(242 + offsetX, 290 + offsetY, 258 + offsetX, 250 + offsetY, 265 + offsetX, 210 + offsetY);

      // Pinky finger outer edge to tip
      p.bezierCurveTo(270 + offsetX, 180 + offsetY, 276 + offsetX, 150 + offsetY, 281 + offsetX, 118 + offsetY);
      p.arc(274 + offsetX, 118 + offsetY, 7.5, 0, Math.PI, true);
      p.bezierCurveTo(266 + offsetX, 148 + offsetY, 258 + offsetX, 174 + offsetY, 252 + offsetX, 192 + offsetY);

      // Valley between pinky and ring
      p.quadraticCurveTo(246 + offsetX, 198 + offsetY, 243 + offsetX, 188 + offsetY);

      // Ring finger
      p.bezierCurveTo(242 + offsetX, 150 + offsetY, 241 + offsetX, 112 + offsetY, 242 + offsetX, 76 + offsetY);
      p.arc(234 + offsetX, 76 + offsetY, 8.5, 0, Math.PI, true);
      p.bezierCurveTo(225 + offsetX, 112 + offsetY, 222 + offsetX, 148 + offsetY, 217 + offsetX, 176 + offsetY);

      // Valley between ring and middle
      p.quadraticCurveTo(211 + offsetX, 186 + offsetY, 204 + offsetX, 174 + offsetY);

      // Middle finger (tallest)
      p.bezierCurveTo(202 + offsetX, 134 + offsetY, 201 + offsetX, 94 + offsetY, 200 + offsetX, 54 + offsetY);
      p.arc(190 + offsetX, 54 + offsetY, 9.5, 0, Math.PI, true);
      p.bezierCurveTo(180 + offsetX, 94 + offsetY, 179 + offsetX, 134 + offsetY, 178 + offsetX, 174 + offsetY);

      // Valley between middle and index
      p.quadraticCurveTo(172 + offsetX, 186 + offsetY, 164 + offsetX, 176 + offsetY);

      // Index finger
      p.bezierCurveTo(160 + offsetX, 144 + offsetY, 156 + offsetX, 110 + offsetY, 153 + offsetX, 74 + offsetY);
      p.arc(144 + offsetX, 74 + offsetY, 8.5, 0, Math.PI, true);
      p.bezierCurveTo(134 + offsetX, 110 + offsetY, 134 + offsetX, 146 + offsetY, 138 + offsetX, 194 + offsetY);

      // Thumb-index webbing valley
      p.quadraticCurveTo(138 + offsetX, 218 + offsetY, 118 + offsetX, 212 + offsetY);

      // Thumb finger pointing outward to left
      p.bezierCurveTo(100 + offsetX, 206 + offsetY, 88 + offsetX, 192 + offsetY, 72 + offsetX, 176 + offsetY);
      p.arc(66 + offsetX, 182 + offsetY, 8.5, -Math.PI * 0.75, Math.PI * 0.25, true);
      p.bezierCurveTo(84 + offsetX, 206 + offsetY, 108 + offsetX, 234 + offsetY, 122 + offsetX, 256 + offsetY);

      // Thenar pad down to wrist left
      p.bezierCurveTo(136 + offsetX, 280 + offsetY, 150 + offsetX, 308 + offsetY, 160 + offsetX, 330 + offsetY);
      p.closePath();

      return p;
    };

    // Render loop
    const render = (now: number) => {
      if (!isRunning) return;

      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, 380, 380);

      // Colors
      const bracketColor = isDark ? '#00E5FF' : '#1D63E8';

      // Mouse Parallax smoothing
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Gentle breathing float
      const floatX = prefersReducedMotion ? 0 : Math.sin(now * 0.0016) * 3 + mouseX;
      const floatY = prefersReducedMotion ? 0 : Math.cos(now * 0.0019) * 3 + mouseY;

      // 1. Draw Viewfinder Corner Brackets
      drawCornerBrackets(380, 380, bracketColor);

      // 2. Concentric Circular Halo Rings
      const cx = 190 + floatX * 0.25;
      const cy = 190 + floatY * 0.25;

      ctx.save();
      // Outer faint ring
      ctx.beginPath();
      ctx.arc(cx, cy, 155, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(0, 229, 255, 0.22)' : 'rgba(29, 99, 232, 0.16)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Inner faint ring
      ctx.beginPath();
      ctx.arc(cx, cy, 128, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(0, 229, 255, 0.30)' : 'rgba(29, 99, 232, 0.22)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Radial Palm Glow behind hand
      const radialGlow = ctx.createRadialGradient(cx, cy + 15, 10, cx, cy + 15, 170);
      radialGlow.addColorStop(0, isDark ? 'rgba(0, 229, 255, 0.38)' : 'rgba(37, 99, 235, 0.32)');
      radialGlow.addColorStop(0.5, isDark ? 'rgba(41, 121, 255, 0.20)' : 'rgba(56, 189, 248, 0.18)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + 15, 170, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Floating 4-Point Diamond Sparkles
      SPARKLES.forEach((sp) => {
        const pulse = prefersReducedMotion ? 0.75 : 0.45 + 0.45 * Math.sin(now * 0.003 + sp.delay);
        drawSparkle(sp.x + floatX * 0.4, sp.y + floatY * 0.4, sp.size, pulse);
      });

      // 4. DRAW VIBRANT SOLID-GLOWING HAND SILHOUETTE
      const handPath = buildHandPath(floatX, floatY);

      ctx.save();
      // Glowing Drop Shadow
      ctx.shadowColor = isDark ? 'rgba(0, 229, 255, 0.70)' : 'rgba(29, 99, 232, 0.60)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Solid Gradient Fill (Cyan -> Royal Blue -> Deep Sapphire)
      const handGrad = ctx.createLinearGradient(190, 50, 190, 330);
      if (isDark) {
        handGrad.addColorStop(0, '#00E5FF'); // Electric Cyan
        handGrad.addColorStop(0.35, '#2979FF'); // Electric Blue
        handGrad.addColorStop(1, '#1565C0'); // Deep Blue
      } else {
        handGrad.addColorStop(0, '#38BDF8'); // Sky Cyan
        handGrad.addColorStop(0.35, '#2563EB'); // Rich Royal Blue
        handGrad.addColorStop(1, '#1D4ED8'); // Deep Royal Blue
      }

      ctx.fillStyle = handGrad;
      ctx.fill(handPath);
      ctx.restore();

      // Outer Silhouette Stroke (Thin Crisp Blue Rim)
      ctx.save();
      ctx.strokeStyle = isDark ? '#80F3FF' : '#93C5FD';
      ctx.lineWidth = 1.4;
      ctx.stroke(handPath);
      ctx.restore();

      // 5. 3D TRIANGULAR POLYGON MESH OVERLAY
      ctx.save();
      const pts = ALL_33_POINTS.map((p) => ({
        x: p.x + floatX,
        y: p.y + floatY,
      }));

      // Render Facets
      for (const [i1, i2, i3] of MESH_TRIANGLES) {
        const pt1 = pts[i1];
        const pt2 = pts[i2];
        const pt3 = pts[i3];

        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.lineTo(pt3.x, pt3.y);
        ctx.closePath();

        // Subtle crystalline facet tint
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fill();

        // White Wireframe Mesh Edge
        ctx.strokeStyle = isDark ? 'rgba(224, 247, 255, 0.70)' : 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.restore();

      // 6. MAJOR BONE CONNECTIONS (Crisp White Lines)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [start, end] of BONE_CONNECTIONS) {
        const p1 = pts[start];
        const p2 = pts[end];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();

      // 7. GLOWING JOINT NODE DOTS (21 Landmarks)
      ctx.save();
      for (let i = 0; i < 21; i++) {
        const pt = pts[i];
        const isTip = [4, 8, 12, 16, 20].includes(i);
        const isKnuckle = [5, 9, 13, 17].includes(i);

        let pulse = 1;
        if (!prefersReducedMotion) {
          pulse = 1 + 0.15 * Math.sin(now * 0.004 + i * 0.6);
        }

        const baseR = isTip ? 4.5 : isKnuckle ? 3.6 : 2.7;
        const r = baseR * pulse;

        // Node Glow Halo
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(0, 229, 255, 0.40)' : 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        // Node Cyan Border Ring
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#00E5FF' : '#38BDF8';
        ctx.fill();

        // Node Pure White Core Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.restore();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [size]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
    </div>
  );
};
