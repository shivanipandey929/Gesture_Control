import React, { useEffect, useRef } from 'react';

// 21 Normalized MediaPipe Hand Landmarks for 6 Morphing Poses
type PoseKey = 'Open palm' | 'Fist' | 'Point' | 'Pinch' | 'Thumbs up' | 'Swipe';

interface PoseDef {
  name: PoseKey;
  landmarks: { x: number; y: number }[];
  swipeOffset?: number;
}

// Canonical hand landmark bones
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], // Palm
];

// 1. Open Palm
const POSE_OPEN_PALM: { x: number; y: number }[] = [
  { x: 0.50, y: 0.85 }, // 0: Wrist
  { x: 0.42, y: 0.75 }, { x: 0.36, y: 0.65 }, { x: 0.31, y: 0.58 }, { x: 0.26, y: 0.53 }, // 1-4 Thumb
  { x: 0.43, y: 0.55 }, { x: 0.41, y: 0.43 }, { x: 0.39, y: 0.34 }, { x: 0.38, y: 0.25 }, // 5-8 Index
  { x: 0.50, y: 0.53 }, { x: 0.50, y: 0.40 }, { x: 0.50, y: 0.30 }, { x: 0.50, y: 0.20 }, // 9-12 Middle
  { x: 0.57, y: 0.55 }, { x: 0.58, y: 0.44 }, { x: 0.60, y: 0.35 }, { x: 0.61, y: 0.26 }, // 13-16 Ring
  { x: 0.64, y: 0.60 }, { x: 0.67, y: 0.52 }, { x: 0.70, y: 0.45 }, { x: 0.72, y: 0.38 }, // 17-20 Pinky
];

// 2. Closed Fist
const POSE_FIST: { x: number; y: number }[] = [
  { x: 0.50, y: 0.85 }, // 0
  { x: 0.44, y: 0.75 }, { x: 0.40, y: 0.68 }, { x: 0.42, y: 0.62 }, { x: 0.48, y: 0.61 }, // Thumb folded across
  { x: 0.45, y: 0.60 }, { x: 0.44, y: 0.54 }, { x: 0.45, y: 0.59 }, { x: 0.46, y: 0.65 }, // Index curled
  { x: 0.50, y: 0.58 }, { x: 0.50, y: 0.52 }, { x: 0.50, y: 0.58 }, { x: 0.50, y: 0.65 }, // Middle curled
  { x: 0.55, y: 0.60 }, { x: 0.56, y: 0.54 }, { x: 0.55, y: 0.59 }, { x: 0.54, y: 0.65 }, // Ring curled
  { x: 0.60, y: 0.63 }, { x: 0.61, y: 0.57 }, { x: 0.60, y: 0.61 }, { x: 0.58, y: 0.66 }, // Pinky curled
];

// 3. Pointing Up
const POSE_POINT: { x: number; y: number }[] = [
  { x: 0.50, y: 0.85 }, // 0
  { x: 0.44, y: 0.75 }, { x: 0.40, y: 0.68 }, { x: 0.42, y: 0.62 }, { x: 0.48, y: 0.61 }, // Thumb
  { x: 0.46, y: 0.55 }, { x: 0.45, y: 0.42 }, { x: 0.44, y: 0.32 }, { x: 0.44, y: 0.22 }, // Index extended straight
  { x: 0.50, y: 0.58 }, { x: 0.50, y: 0.52 }, { x: 0.50, y: 0.58 }, { x: 0.50, y: 0.65 }, // Middle curled
  { x: 0.55, y: 0.60 }, { x: 0.56, y: 0.54 }, { x: 0.55, y: 0.59 }, { x: 0.54, y: 0.65 }, // Ring curled
  { x: 0.60, y: 0.63 }, { x: 0.61, y: 0.57 }, { x: 0.60, y: 0.61 }, { x: 0.58, y: 0.66 }, // Pinky curled
];

// 4. Pinch
const POSE_PINCH: { x: number; y: number }[] = [
  { x: 0.50, y: 0.85 }, // 0
  { x: 0.44, y: 0.73 }, { x: 0.41, y: 0.62 }, { x: 0.44, y: 0.52 }, { x: 0.48, y: 0.46 }, // Thumb meets index
  { x: 0.47, y: 0.57 }, { x: 0.47, y: 0.50 }, { x: 0.48, y: 0.46 }, { x: 0.49, y: 0.45 }, // Index tip touching thumb
  { x: 0.52, y: 0.58 }, { x: 0.53, y: 0.50 }, { x: 0.53, y: 0.42 }, { x: 0.54, y: 0.35 }, // Middle semi-open
  { x: 0.57, y: 0.60 }, { x: 0.58, y: 0.52 }, { x: 0.60, y: 0.44 }, { x: 0.61, y: 0.37 }, // Ring open
  { x: 0.62, y: 0.64 }, { x: 0.65, y: 0.56 }, { x: 0.68, y: 0.49 }, { x: 0.70, y: 0.42 }, // Pinky open
];

// 5. Thumbs Up
const POSE_THUMBS_UP: { x: number; y: number }[] = [
  { x: 0.50, y: 0.85 }, // 0: Wrist
  { x: 0.43, y: 0.74 }, { x: 0.39, y: 0.60 }, { x: 0.38, y: 0.44 }, { x: 0.38, y: 0.28 }, // 1-4 Thumb pointing straight UP
  { x: 0.48, y: 0.70 }, { x: 0.53, y: 0.68 }, { x: 0.55, y: 0.73 }, { x: 0.52, y: 0.77 }, // Index curled
  { x: 0.53, y: 0.72 }, { x: 0.58, y: 0.70 }, { x: 0.60, y: 0.75 }, { x: 0.57, y: 0.79 }, // Middle curled
  { x: 0.57, y: 0.74 }, { x: 0.62, y: 0.72 }, { x: 0.64, y: 0.77 }, { x: 0.61, y: 0.81 }, // Ring curled
  { x: 0.61, y: 0.76 }, { x: 0.66, y: 0.74 }, { x: 0.68, y: 0.79 }, { x: 0.65, y: 0.83 }, // Pinky curled
];

// 6. Swipe (Tilted open palm with horizontal glide)
const POSE_SWIPE: { x: number; y: number }[] = POSE_OPEN_PALM.map((pt) => ({
  x: pt.x + 0.08,
  y: pt.y - 0.04,
}));

const POSES: PoseDef[] = [
  { name: 'Open palm', landmarks: POSE_OPEN_PALM },
  { name: 'Fist', landmarks: POSE_FIST },
  { name: 'Point', landmarks: POSE_POINT },
  { name: 'Pinch', landmarks: POSE_PINCH },
  { name: 'Thumbs up', landmarks: POSE_THUMBS_UP },
  { name: 'Swipe', landmarks: POSE_SWIPE, swipeOffset: 0.12 },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export const DriftingHandConstellation: React.FC<{ className?: string }> = ({ className = '' }) => {
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

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 25 : 60;
    const particles: Particle[] = [];
    const ripples: Ripple[] = [];
    const trailPoints: TrailPoint[] = [];

    // Poses morphing loop
    let currentPoseIdx = 0;
    let targetPoseIdx = 1;
    let morphProgress = 0;
    let lastMorphTime = performance.now();
    let lastFrameTime = performance.now();
    const POSE_HOLD_TIME = 2400; // ms per pose
    const POSE_TRANSITION_TIME = 900; // ms to morph

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0) {
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() > 0.8 ? 2.2 : 1.3,
            alpha: 0.2 + Math.random() * 0.45,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 36;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 36;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isRunning = true;
        lastFrameTime = performance.now();
        lastMorphTime = performance.now();
        if (!prefersReducedMotion) animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const triggerRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 6,
        maxRadius: isMobile ? 60 : 95,
        alpha: 0.6,
        speed: 1.4,
      });
      if (ripples.length > 8) ripples.shift();
    };

    // Render helper for hand skeleton
    const drawHandSkeleton = (
      points: { x: number; y: number }[],
      alphaMult: number,
      scaleMult: number,
      isDark: boolean
    ) => {
      if (points.length < 21) return;

      const mainColor = isDark ? '#00E5FF' : '#1D63E8';
      const secondaryColor = isDark ? '#2979FF' : '#4F46E5';

      // 1. Bones
      ctx.lineWidth = Math.max(1.2, 2.2 * scaleMult);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [start, end] of HAND_CONNECTIONS) {
        const pt1 = points[start];
        const pt2 = points[end];

        // Subtle glowing bone line
        ctx.strokeStyle = mainColor;
        ctx.globalAlpha = (isDark ? 0.35 : 0.45) * alphaMult;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();

        // Sharp core bone
        ctx.strokeStyle = secondaryColor;
        ctx.globalAlpha = (isDark ? 0.65 : 0.75) * alphaMult;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      }

      // 2. Joints
      for (let i = 0; i < 21; i++) {
        const pt = points[i];
        const isTip = [4, 8, 12, 16, 20].includes(i);
        const jointRadius = (isTip ? 4.5 : 3.0) * scaleMult;

        // Outer radial glow
        const glowRadius = jointRadius * 2.8;
        const radialGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowRadius);
        radialGrad.addColorStop(0, isDark ? 'rgba(0, 229, 255, 0.7)' : 'rgba(29, 99, 232, 0.55)');
        radialGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = radialGrad;
        ctx.globalAlpha = alphaMult;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid core
        ctx.fillStyle = isDark ? '#FFFFFF' : '#F8FAFC';
        ctx.globalAlpha = 0.95 * alphaMult;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, jointRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Main render loop
    const render = () => {
      if (!ctx || !canvas || !isRunning) return;

      const now = performance.now();
      const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const isDark = document.documentElement.classList.contains('dark');

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // 1. Clear background
      ctx.clearRect(0, 0, width, height);

      // 2. Lush, Futuristic Gradient Mesh
      // Base fill
      ctx.fillStyle = isDark ? '#080F1F' : '#F4F7FF';
      ctx.fillRect(0, 0, width, height);

      // Drifting Blobs
      const t = now * 0.0006;
      const blob1X = width * 0.22 + Math.sin(t * 0.8) * 90;
      const blob1Y = height * 0.38 + Math.cos(t * 0.7) * 70;
      const blob1R = Math.max(width, height) * 0.52;
      const grad1 = ctx.createRadialGradient(blob1X, blob1Y, 0, blob1X, blob1Y, blob1R);
      if (isDark) {
        grad1.addColorStop(0, 'rgba(41, 121, 255, 0.32)');
        grad1.addColorStop(0.5, 'rgba(29, 99, 232, 0.14)');
        grad1.addColorStop(1, 'rgba(8, 15, 31, 0)');
      } else {
        grad1.addColorStop(0, 'rgba(147, 197, 253, 0.55)');
        grad1.addColorStop(0.5, 'rgba(191, 219, 254, 0.25)');
        grad1.addColorStop(1, 'rgba(244, 247, 255, 0)');
      }
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const blob2X = width * 0.14 + Math.cos(t * 0.9) * 80;
      const blob2Y = height * 0.68 + Math.sin(t * 0.6) * 70;
      const blob2R = Math.max(width, height) * 0.48;
      const grad2 = ctx.createRadialGradient(blob2X, blob2Y, 0, blob2X, blob2Y, blob2R);
      if (isDark) {
        grad2.addColorStop(0, 'rgba(0, 229, 255, 0.24)');
        grad2.addColorStop(0.6, 'rgba(0, 229, 255, 0.06)');
        grad2.addColorStop(1, 'rgba(8, 15, 31, 0)');
      } else {
        grad2.addColorStop(0, 'rgba(165, 243, 252, 0.50)');
        grad2.addColorStop(0.6, 'rgba(207, 250, 254, 0.20)');
        grad2.addColorStop(1, 'rgba(244, 247, 255, 0)');
      }
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      const blob3X = width * 0.42 + Math.sin(t * 0.5) * 80;
      const blob3Y = height * 0.48 + Math.cos(t * 0.8) * 80;
      const blob3R = Math.max(width, height) * 0.45;
      const grad3 = ctx.createRadialGradient(blob3X, blob3Y, 0, blob3X, blob3Y, blob3R);
      if (isDark) {
        grad3.addColorStop(0, 'rgba(124, 58, 237, 0.20)');
        grad3.addColorStop(0.6, 'rgba(79, 70, 229, 0.06)');
        grad3.addColorStop(1, 'rgba(8, 15, 31, 0)');
      } else {
        grad3.addColorStop(0, 'rgba(221, 214, 254, 0.45)');
        grad3.addColorStop(0.6, 'rgba(238, 242, 255, 0.20)');
        grad3.addColorStop(1, 'rgba(244, 247, 255, 0)');
      }
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // 3. Floating Dust Particles with Parallax
      ctx.fillStyle = isDark ? '#00E5FF' : '#1D63E8';
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        ctx.globalAlpha = p.alpha * (isDark ? 0.75 : 0.6);
        ctx.beginPath();
        ctx.arc(p.x + mouseX * 0.35, p.y + mouseY * 0.35, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Morphing Pose Calculation
      if (!prefersReducedMotion) {
        const elapsed = now - lastMorphTime;
        if (elapsed > POSE_HOLD_TIME) {
          const transProgress = Math.min(1, (elapsed - POSE_HOLD_TIME) / POSE_TRANSITION_TIME);
          // Cosine smooth easing
          morphProgress = 0.5 - 0.5 * Math.cos(transProgress * Math.PI);

          if (transProgress >= 1) {
            currentPoseIdx = targetPoseIdx;
            targetPoseIdx = (targetPoseIdx + 1) % POSES.length;
            lastMorphTime = now;
            morphProgress = 0;
          }
        }
      }

      const p1 = POSES[currentPoseIdx].landmarks;
      const p2 = POSES[targetPoseIdx].landmarks;
      const s1 = POSES[currentPoseIdx].swipeOffset || 0;
      const s2 = POSES[targetPoseIdx].swipeOffset || 0;
      const activeSwipeOffset = s1 + (s2 - s1) * morphProgress;

      // Layout: Desktop Hand on Left ~55% of viewport width; Mobile scaled down at top
      const baseScale = Math.min(width * (isMobile ? 0.68 : 0.55), height * (isMobile ? 0.36 : 0.78));
      const mainHandX = isMobile
        ? width * 0.5 + activeSwipeOffset * width * 0.35
        : width * 0.30 + mouseX + activeSwipeOffset * width * 0.4;
      const mainHandY = isMobile
        ? height * 0.15 + mouseY * 0.2
        : height * 0.50 + mouseY;

      const interpolateLandmarks = (
        centerX: number,
        centerY: number,
        scale: number,
        progressOffset: number = 0
      ) => {
        const effProgress = Math.min(1, Math.max(0, morphProgress + progressOffset));
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 21; i++) {
          const nx = p1[i].x + (p2[i].x - p1[i].x) * effProgress;
          const ny = p1[i].y + (p2[i].y - p1[i].y) * effProgress;
          pts.push({
            x: centerX + (nx - 0.5) * scale,
            y: centerY + (ny - 0.5) * scale,
          });
        }
        return pts;
      };

      // 5. Draw 2 Depth Hands (Layered behind main hand with parallax speeds)
      if (!isMobile) {
        // Deep background hand 2 (furthest, smallest, slowest parallax)
        const depth2Points = interpolateLandmarks(
          mainHandX + width * 0.12 + mouseX * 0.2,
          mainHandY + height * 0.10 + mouseY * 0.2,
          baseScale * 0.38,
          0.05
        );
        drawHandSkeleton(depth2Points, 0.18, 0.38, isDark);

        // Mid background hand 1 (medium depth)
        const depth1Points = interpolateLandmarks(
          mainHandX - width * 0.09 + mouseX * 0.4,
          mainHandY - height * 0.08 + mouseY * 0.4,
          baseScale * 0.58,
          -0.03
        );
        drawHandSkeleton(depth1Points, 0.32, 0.58, isDark);
      }

      // 6. Main Foreground Hand Skeleton
      const mainPoints = interpolateLandmarks(mainHandX, mainHandY, baseScale, 0);

      // Trailing Wave Ribbon from Index Tip (Landmark 8)
      if (mainPoints[8] && !prefersReducedMotion) {
        trailPoints.push({ x: mainPoints[8].x, y: mainPoints[8].y, time: now });
        // Trigger ripple near end of pose morph
        if (morphProgress > 0.95 && ripples.length === 0) {
          triggerRipple(mainPoints[8].x, mainPoints[8].y);
        }
      }

      // Render Trailing Wave Ribbon
      while (trailPoints.length > 0 && now - trailPoints[0].time > 650) {
        trailPoints.shift();
      }

      if (trailPoints.length > 2) {
        ctx.beginPath();
        ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
        for (let i = 1; i < trailPoints.length; i++) {
          ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
        }
        ctx.strokeStyle = isDark ? '#00E5FF' : '#1D63E8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = isDark ? 0.25 : 0.35;
        ctx.stroke();
      }

      // Concentric Ripple Rings
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed * (dt * 60);
        const progress = rip.radius / rip.maxRadius;
        rip.alpha = Math.max(0, 0.55 * (1 - progress));

        if (progress >= 1 || rip.alpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = isDark ? '#00E5FF' : '#1D63E8';
        ctx.lineWidth = 1.5;

        // Outer ripple
        ctx.globalAlpha = rip.alpha;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner harmonic ripple
        if (rip.radius > 12) {
          ctx.globalAlpha = rip.alpha * 0.6;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius * 0.62, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Main Hand
      drawHandSkeleton(mainPoints, 1.0, 1.0, isDark);

      ctx.globalAlpha = 1;

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render();
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default DriftingHandConstellation;
