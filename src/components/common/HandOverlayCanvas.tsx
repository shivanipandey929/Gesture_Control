import React, { useRef, useEffect } from 'react';
import { masterGestureEngine } from '../../engine';

export interface HandOverlayCanvasProps {
  className?: string;
  drawSkeleton?: boolean;
  showGestureChip?: boolean;
  videoDimensions?: { width: number; height: number; objectFit?: 'cover' | 'contain' };
  style?: React.CSSProperties;
}

/**
 * Reusable hand skeleton overlay canvas.
 * Handles exact mount/unmount registration with masterGestureEngine,
 * automatic ResizeObserver resolution matching DPR, and camera stream alignment.
 */
export const HandOverlayCanvas: React.FC<HandOverlayCanvasProps> = ({
  className = 'absolute inset-0 w-full h-full object-cover pointer-events-none z-10',
  drawSkeleton = true,
  showGestureChip = true,
  videoDimensions,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Lifecycle: Register on mount / update, unregister on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const findVideoDimensions = () => {
      if (videoDimensions && videoDimensions.width > 0) return videoDimensions;
      const parent = canvas.parentElement;
      const siblingVideo = parent ? (parent.querySelector('video') as HTMLVideoElement | null) : null;
      if (siblingVideo && siblingVideo.videoWidth > 0) {
        return {
          width: siblingVideo.videoWidth,
          height: siblingVideo.videoHeight,
          objectFit: 'cover' as const,
        };
      }
      return undefined;
    };

    const unregister = masterGestureEngine.registerCanvas(
      canvas,
      drawSkeleton,
      showGestureChip,
      findVideoDimensions()
    );

    return () => {
      unregister();
    };
  }, [drawSkeleton, showGestureChip, videoDimensions]);

  // 2. Responsive Sizing & Device Pixel Ratio Alignment
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncDimensions = () => {
      if (!canvas) return;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const rect = canvas.getBoundingClientRect();
      const parentRect = canvas.parentElement?.getBoundingClientRect();

      const displayW = Math.round(rect.width || parentRect?.width || canvas.clientWidth || 320);
      const displayH = Math.round(rect.height || parentRect?.height || canvas.clientHeight || 240);

      const targetW = Math.round(displayW * dpr);
      const targetH = Math.round(displayH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    syncDimensions();

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncDimensions())
        : null;

    if (ro) {
      ro.observe(canvas);
      if (canvas.parentElement) {
        ro.observe(canvas.parentElement);
      }
    }

    window.addEventListener('resize', syncDimensions);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', syncDimensions);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
};

export default HandOverlayCanvas;
