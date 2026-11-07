import { useEffect, useRef, useState, useCallback } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getGestureRecognizer } from '../services/mediapipe';
import { LandmarkSmoother } from './smoothing';
import { SwipeDetector } from './swipeDetector';
import { GestureFilter } from './gestureFilter';
import { actionDispatcher, type SemanticAction } from './actionDispatcher';
import { drawHandSkeleton } from '../utils/handDrawer';
import { calculateBrightness } from '../utils/lighting';
import { customKNN } from './knnClassifier';
import { logGestureEvent } from '../db/db';

export interface GestureEngineState {
  rawGesture: string;
  filteredGesture: string;
  confidence: number;
  lastAction: SemanticAction | null;
  fps: number;
  isModelLoading: boolean;
  modelError: string | null;
  isCameraDenied: boolean;
  isCameraLoading: boolean;
  hasHand: boolean;
  isLowLight: boolean;
  brightness: number;
  inCooldown: boolean;
  stabilityProgress: number;
  isTabHidden: boolean;
  wristVelocity: { vx: number; vy: number };
  frameProcessingTimeMs: number;
  isCustomGesture: boolean;
}

export function useGestureEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options?: {
    drawSkeleton?: boolean;
    confidenceThreshold?: number;
    stabilityDurationMs?: number;
    cooldownDurationMs?: number;
    lowEndMode?: boolean;
    onAction?: (action: SemanticAction, gesture: string) => void;
  }
) {
  const drawSkeleton = options?.drawSkeleton ?? true;
  const lowEndMode = options?.lowEndMode ?? false;
  const onActionRef = useRef(options?.onAction);
  onActionRef.current = options?.onAction;

  const [state, setState] = useState<GestureEngineState>({
    rawGesture: 'None',
    filteredGesture: 'None',
    confidence: 0,
    lastAction: null,
    fps: 0,
    isModelLoading: true,
    modelError: null,
    isCameraDenied: false,
    isCameraLoading: true,
    hasHand: false,
    isLowLight: false,
    brightness: 128,
    inCooldown: false,
    stabilityProgress: 0,
    isTabHidden: false,
    wristVelocity: { vx: 0, vy: 0 },
    frameProcessingTimeMs: 0,
    isCustomGesture: false,
  });

  const smootherRef = useRef(new LandmarkSmoother());
  const swipeDetectorRef = useRef(new SwipeDetector());
  const filterRef = useRef(
    new GestureFilter({
      confidenceThreshold: options?.confidenceThreshold ?? 0.7,
      stabilityDurationMs: options?.stabilityDurationMs ?? 350,
      cooldownDurationMs: options?.cooldownDurationMs ?? 600,
    })
  );

  // Update filter configs if options change
  useEffect(() => {
    filterRef.current.updateConfig({
      confidenceThreshold: options?.confidenceThreshold ?? 0.7,
      stabilityDurationMs: options?.stabilityDurationMs ?? 350,
      cooldownDurationMs: options?.cooldownDurationMs ?? 600,
    });
  }, [options?.confidenceThreshold, options?.stabilityDurationMs, options?.cooldownDurationMs]);

  // Load custom gestures from IndexedDB
  useEffect(() => {
    customKNN.loadFromDB();
  }, []);

  const animationFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const isTabHiddenRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const latestLandmarksRef = useRef<NormalizedLandmark[]>([]);

  // Handle browser tab visibility change to pause detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.visibilityState === 'hidden';
      isTabHiddenRef.current = hidden;
      setState((prev) => ({ ...prev, isTabHidden: hidden }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Request and initialize camera stream (adjust resolution for low-end mode)
  const initCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, isCameraLoading: true, isCameraDenied: false }));
    try {
      const targetWidth = lowEndMode ? 320 : 640;
      const targetHeight = lowEndMode ? 240 : 480;
      const targetFps = lowEndMode ? 15 : 30;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          facingMode: 'user',
          frameRate: { ideal: targetFps, max: targetFps },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setState((prev) => ({ ...prev, isCameraLoading: false }));
        };
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or error:', err);
      setState((prev) => ({
        ...prev,
        isCameraLoading: false,
        isCameraDenied: true,
      }));
    }
  }, [lowEndMode, videoRef]);

  // Main recognition loop
  useEffect(() => {
    let isCancelled = false;

    async function startEngine() {
      try {
        setState((prev) => ({ ...prev, isModelLoading: true, modelError: null }));
        const recognizer = await getGestureRecognizer();
        if (isCancelled) return;
        setState((prev) => ({ ...prev, isModelLoading: false }));

        await initCamera();

        const processLoop = () => {
          if (isCancelled) return;

          // If browser tab is hidden or video isn't ready, skip heavy recognition
          if (
            isTabHiddenRef.current ||
            !videoRef.current ||
            videoRef.current.readyState < 2 ||
            videoRef.current.paused
          ) {
            animationFrameIdRef.current = requestAnimationFrame(processLoop);
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          const now = Date.now();

          // Match canvas size to video render size
          if (canvas && video.videoWidth > 0) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }

          // Calculate FPS every 500ms
          frameCountRef.current++;
          if (now - lastFpsUpdateRef.current >= 500) {
            const currentFps = Math.round(
              (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
            );
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
            setState((prev) => ({ ...prev, fps: currentFps }));
          }

          // Process new video frame
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const t0 = performance.now();

            // Check ambient lighting periodically
            const brightness = calculateBrightness(video);
            const isLowLight = brightness < 40;

            const recognitionResults = recognizer.recognizeForVideo(video, now);

            // Clear previous canvas drawing
            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            const rawGestures = recognitionResults.gestures;
            const rawLandmarks = recognitionResults.landmarks;

            if (rawLandmarks && rawLandmarks.length > 0 && rawLandmarks[0].length === 21) {
              const currentLandmarks = rawLandmarks[0];

              // 1. One-Euro Smoothing
              const smoothedLandmarks = smootherRef.current.smooth(currentLandmarks, now);
              latestLandmarksRef.current = smoothedLandmarks;

              // 2. Draw Hand Skeleton on Canvas
              if (drawSkeleton && ctx && canvas) {
                drawHandSkeleton(ctx, smoothedLandmarks, canvas.width, canvas.height, true);
              }

              // 3. Dynamic Swipe Detection
              const { swipe, velocity } = swipeDetectorRef.current.update(smoothedLandmarks, now);

              // 4. Custom KNN Gesture check
              const knnMatch = customKNN.classify(smoothedLandmarks);

              let candidateGesture = 'None';
              let candidateScore = 0;
              let isCustom = false;

              if (knnMatch) {
                candidateGesture = knnMatch.gestureName;
                candidateScore = knnMatch.confidence;
                isCustom = true;
              } else if (swipe) {
                candidateGesture = swipe;
                candidateScore = 0.95;
              } else if (rawGestures && rawGestures.length > 0 && rawGestures[0].length > 0) {
                candidateGesture = rawGestures[0][0].categoryName;
                candidateScore = rawGestures[0][0].score;
              }

              // 5. Apply stability timer, confidence check, and cooldown
              const { filteredGesture, isTriggered, stabilityProgress, inCooldown } =
                filterRef.current.process(candidateGesture, candidateScore, now);

              // 6. Action Dispatcher
              if (isTriggered && filteredGesture !== 'None') {
                let action: SemanticAction = 'none';
                if (knnMatch && knnMatch.gestureName === filteredGesture) {
                  action = knnMatch.action as SemanticAction;
                  actionDispatcher.dispatch(filteredGesture, now);
                } else {
                  action = actionDispatcher.dispatch(filteredGesture, now);
                }

                if (action !== 'none') {
                  logGestureEvent(filteredGesture, action, candidateScore);
                  setState((prev) => ({ ...prev, lastAction: action }));
                  if (onActionRef.current) {
                    onActionRef.current(action, filteredGesture);
                  }
                }
              }

              const frameProcessingTimeMs = Math.round(performance.now() - t0);

              setState((prev) => ({
                ...prev,
                hasHand: true,
                rawGesture: candidateGesture,
                filteredGesture,
                confidence: candidateScore,
                isLowLight,
                brightness,
                inCooldown,
                stabilityProgress,
                wristVelocity: velocity,
                frameProcessingTimeMs,
                isCustomGesture: isCustom,
              }));
            } else {
              // No hand detected
              smootherRef.current.reset();
              swipeDetectorRef.current.reset();
              filterRef.current.reset();

              setState((prev) => ({
                ...prev,
                hasHand: false,
                rawGesture: 'None',
                filteredGesture: 'None',
                confidence: 0,
                stabilityProgress: 0,
                isLowLight,
                brightness,
                frameProcessingTimeMs: 0,
                isCustomGesture: false,
              }));
            }
          }

          animationFrameIdRef.current = requestAnimationFrame(processLoop);
        };

        animationFrameIdRef.current = requestAnimationFrame(processLoop);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setState((prev) => ({ ...prev, isModelLoading: false, modelError: msg }));
        }
      }
    }

    startEngine();

    return () => {
      isCancelled = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [drawSkeleton, initCamera, canvasRef, videoRef]);

  return {
    state,
    retryCamera: initCamera,
    smoother: smootherRef.current,
    getLandmarks: () => latestLandmarksRef.current,
  };
}
