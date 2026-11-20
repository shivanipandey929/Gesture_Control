import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getGestureRecognizer } from '../services/mediapipe';
import { LandmarkSmoother } from './smoothing';
import { SwipeDetector } from './swipeDetector';
import { WaveDetector } from './waveDetector';
import { GestureFilter } from './gestureFilter';
import { drawHandSkeleton, drawHandDistanceGuide } from '../utils/handDrawer';
import { customKNN } from './knnClassifier';
import { sharedPointerMapper } from './pointerMapper';
import type { GestureAction } from '../context/GestureContext';
import type {
  GestureCategoryScore,
  GestureEngineState,
  CanvasEntry,
} from './types';
import { generateSyntheticLandmarks } from './syntheticLandmarks';

interface HTMLVideoElementWithCallback {
  requestVideoFrameCallback(callback: VideoFrameRequestCallback): number;
  cancelVideoFrameCallback(handle: number): void;
}

const createLm = (x: number, y: number, z: number = 0): NormalizedLandmark => ({
  x,
  y,
  z,
  visibility: 1,
});

export class MasterGestureEngine {
  private static instance: MasterGestureEngine | null = null;

  public static getInstance(): MasterGestureEngine {
    if (!MasterGestureEngine.instance) {
      MasterGestureEngine.instance = new MasterGestureEngine();
    }
    return MasterGestureEngine.instance;
  }

  // Master hidden processing elements
  private masterVideo: HTMLVideoElement;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  // Detectors and smoothers
  public smoother: LandmarkSmoother = new LandmarkSmoother();
  public swipeDetector: SwipeDetector = new SwipeDetector('relaxed');
  public waveDetector: WaveDetector = new WaveDetector();
  public filter: GestureFilter = new GestureFilter('relaxed');

  // Registered visible canvases for skeleton drawing
  private canvases: Set<CanvasEntry> = new Set();

  // Subscribers listening for engine state changes
  private subscribers: Set<(state: GestureEngineState) => void> = new Set();

  // 60 FPS continuous render loop variables
  private renderLoopId: number | null = null;
  public targetLandmarks: NormalizedLandmark[] = [];
  public renderedLandmarks: NormalizedLandmark[] = [];
  private jointVelocities: { vx: number; vy: number; vz: number }[] = [];
  private lastLandmarksTime: number = 0;
  public skeletonStyle: 'Clean' | 'Glow' = 'Glow';
  public lastHandSeenTime: number = Date.now();

  // Simulated hand developer/demo mode
  public isSimulatedHand: boolean = false;
  public simulatedPose: string = 'Open_Palm';
  public simulatedPos: { x: number; y: number } = { x: 0.5, y: 0.5 };
  private simIntervalId: number | null = null;

  // Internal state
  public state: GestureEngineState = {
    rawGesture: 'None',
    filteredGesture: 'None',
    confidence: 0,
    lastAction: null,
    fps: 0,
    cameraFps: 0,
    isModelLoading: false,
    modelError: null,
    hasHand: false,
    isLowLight: false,
    brightness: 128,
    inCooldown: false,
    stabilityProgress: 0,
    holdTimeHeldMs: 0,
    holdRequiredMs: 250,
    isTabHidden: false,
    wristVelocity: { vx: 0, vy: 0 },
    frameProcessingTimeMs: 0,
    drawTimeMs: 0,
    cameraFrameToResultMs: 0,
    isCustomGesture: false,
    top3Categories: [],
    swipeTelemetry: this.swipeDetector.telemetry,
    waveTelemetry: this.waveDetector.telemetry,
    whyNotFired: 'Waiting for camera',
    lowFpsWarning: false,
    brightnessBoost: false,
  };

  public latestLandmarks: NormalizedLandmark[] = [];
  public currentStream: MediaStream | null = null;

  private isRunning: boolean = false;
  private isProcessing: boolean = false;
  private animFrameId: number | null = null;
  private callbackId: number | null = null;
  private lastVideoTime: number = -1;

  // FPS and throttling
  private frameCount: number = 0;
  private lastFpsUpdate: number = Date.now();
  private lastNotifiedFps: number = 0;
  private lastNotifiedGesture: string = 'None';
  private lastNotifiedHand: boolean = false;
  private lowFpsCounter: number = 0;

  // Global action dispatcher hook
  public dispatchActionFn: ((gesture: string, confidence: number) => GestureAction) | null = null;
  public recordHandPresenceFn: ((hasHand: boolean) => void) | null = null;
  public setDiagnosticsFn: ((diag: { fps?: number; inferenceMs?: number; handsDetected?: number }) => void) | null = null;

  private constructor() {
    this.masterVideo = document.createElement('video');
    this.masterVideo.autoplay = true;
    this.masterVideo.muted = true;
    this.masterVideo.playsInline = true;

    // Downscaled 320x240 offscreen canvas for high-speed AI inference
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 320;
    this.offscreenCanvas.height = 240;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: false });

    // Load KNN database
    customKNN.loadFromDB();

    // Start continuous 60 FPS render loop
    this.startRenderLoop();

    // Restore simulated hand setting if persisted
    if (typeof localStorage !== 'undefined' && localStorage.getItem('aerotouch_simulated_hand') === 'true') {
      this.setSimulatedHand(true);
    }
  }

  public registerCanvas(
    canvas: HTMLCanvasElement,
    drawSkeleton: boolean = true,
    showGestureChip: boolean = true,
    videoDimensions?: { width: number; height: number; objectFit?: 'cover' | 'contain' }
  ): () => void {
    // Idempotent registration: replace any existing entry referencing this canvas
    for (const existing of Array.from(this.canvases)) {
      if (existing.canvas === canvas) {
        this.canvases.delete(existing);
      }
    }

    const entry: CanvasEntry = { canvas, drawSkeleton, showGestureChip, videoDimensions };
    this.canvases.add(entry);
    return () => {
      this.canvases.delete(entry);
    };
  }

  public getRegisteredCanvases(): CanvasEntry[] {
    for (const entry of Array.from(this.canvases)) {
      if (!entry.canvas || (typeof entry.canvas.isConnected === 'boolean' && !entry.canvas.isConnected)) {
        this.canvases.delete(entry);
      }
    }
    return Array.from(this.canvases);
  }

  public subscribe(cb: (state: GestureEngineState) => void): () => void {
    this.subscribers.add(cb);
    cb(this.state);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }

  public setSensitivity(sens: 'relaxed' | 'normal' | 'strict') {
    this.swipeDetector.setSensitivity(sens);
    this.filter.setSensitivity(sens);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aerotouch_sensitivity', sens);
    }
  }

  public setStream(stream: MediaStream | null) {
    if (this.currentStream === stream) return;
    this.currentStream = stream;

    if (stream) {
      this.masterVideo.srcObject = stream;
      this.masterVideo.play().catch(() => { });
      this.startLoop();
    } else {
      this.stopLoop();
      this.masterVideo.srcObject = null;
    }
  }

  /**
   * Continuous 60 FPS requestAnimationFrame render loop independent of detection FPS.
   * Interpolates landmarks with velocity prediction (up to 60 ms) and exponential smoothing.
   */
  private startRenderLoop() {
    if (this.renderLoopId !== null) return;

    const render = () => {
      this.renderLoopId = requestAnimationFrame(render);
      this.renderFrame();
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.renderLoopId = requestAnimationFrame(render);
    }
  }

  /**
   * Renders a single frame to all registered canvases.
   * Can be called directly or continuously via startRenderLoop().
   */
  public renderFrame() {
    const now = performance.now();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Drop canvases that are no longer connected to the DOM
    for (const entry of Array.from(this.canvases)) {
      if (!entry.canvas || (typeof entry.canvas.isConnected === 'boolean' && !entry.canvas.isConnected)) {
        this.canvases.delete(entry);
      }
    }

    const hasActiveHand =
      (this.targetLandmarks.length === 21 && (now - this.lastLandmarksTime < 400)) ||
      (this.isSimulatedHand && this.targetLandmarks.length === 21);

    if (hasActiveHand) {
      // Velocity extrapolation (up to 60 ms)
      const elapsed = Math.min(60, Math.max(0, now - this.lastLandmarksTime));
      const dtSec = elapsed / 1000;
      const alpha = 0.35; // Smoothing factor for 60 FPS

      for (let i = 0; i < 21; i++) {
        const target = this.targetLandmarks[i];
        const vel = this.jointVelocities[i] || { vx: 0, vy: 0, vz: 0 };
        const predictedX = target.x + vel.vx * dtSec * 0.4;
        const predictedY = target.y + vel.vy * dtSec * 0.4;
        const predictedZ = target.z + vel.vz * dtSec * 0.4;

        if (!this.renderedLandmarks[i]) {
          this.renderedLandmarks[i] = createLm(predictedX, predictedY, predictedZ);
        } else {
          this.renderedLandmarks[i].x += (predictedX - this.renderedLandmarks[i].x) * alpha;
          this.renderedLandmarks[i].y += (predictedY - this.renderedLandmarks[i].y) * alpha;
          this.renderedLandmarks[i].z += (predictedZ - this.renderedLandmarks[i].z) * alpha;
        }
      }

      // Draw skeleton to all registered canvases
      for (const entry of this.canvases) {
        const { canvas, drawSkeleton } = entry;
        if (!canvas) continue;

        const displayW = canvas.clientWidth || 320;
        const displayH = canvas.clientHeight || 240;
        const targetW = Math.round(displayW * dpr);
        const targetH = Math.round(displayH * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, displayW, displayH);

          if (drawSkeleton) {
            const dims = entry.videoDimensions || {
              width: this.masterVideo?.videoWidth || 640,
              height: this.masterVideo?.videoHeight || 480,
              objectFit: 'cover' as const,
            };

            drawHandSkeleton(
              ctx,
              this.renderedLandmarks,
              displayW,
              displayH,
              true,
              this.state.filteredGesture !== 'None' ? this.state.filteredGesture : undefined,
              this.state.confidence,
              this.skeletonStyle,
              entry.showGestureChip !== false,
              dims
            );
          }
        }
      }
    } else {
      // Clear all registered canvases or show hand distance guide if no hand found for 2s
      const nowMs = Date.now();
      const showDistanceGuide = this.currentStream && this.currentStream.active && nowMs - this.lastHandSeenTime > 2000;
      this.renderedLandmarks = [];
      this.targetLandmarks = [];

      for (const entry of this.canvases) {
        const canvas = entry.canvas;
        if (!canvas) continue;
        const displayW = canvas.clientWidth || 320;
        const displayH = canvas.clientHeight || 240;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const targetW = Math.round(displayW * dpr);
        const targetH = Math.round(displayH * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, displayW, displayH);

          if (showDistanceGuide && entry.drawSkeleton) {
            let reason = 'Center hand in frame';
            if (this.state.brightness < 40) {
              reason = 'Too dark - increase room lighting';
            } else if (this.state.whyNotFired && this.state.whyNotFired !== 'No hand detected') {
              reason = this.state.whyNotFired;
            }
            drawHandDistanceGuide(ctx, displayW, displayH, reason);
          }
        }
      }
    }
  }

  /**
   * Feed synthetic landmarks into detection pipeline (Simulated Hand mode).
   */
  public feedSyntheticLandmarks(landmarks: NormalizedLandmark[], gestureName?: string) {
    const now = Date.now();
    this.latestLandmarks = landmarks;

    const tNow = performance.now();
    const dt = Math.max(1, tNow - this.lastLandmarksTime);
    this.lastLandmarksTime = tNow;

    if (this.targetLandmarks.length === 21) {
      for (let i = 0; i < 21; i++) {
        this.jointVelocities[i] = {
          vx: (landmarks[i].x - this.targetLandmarks[i].x) / (dt / 1000),
          vy: (landmarks[i].y - this.targetLandmarks[i].y) / (dt / 1000),
          vz: (landmarks[i].z - this.targetLandmarks[i].z) / (dt / 1000),
        };
      }
    } else {
      this.jointVelocities = Array.from({ length: 21 }, () => ({ vx: 0, vy: 0, vz: 0 }));
      this.renderedLandmarks = landmarks.map((lm) => ({ ...lm }));
    }
    this.targetLandmarks = landmarks;

    const smoothed = this.smoother.smooth(landmarks, now);
    const waveRes = this.waveDetector.update(smoothed, now);
    const { swipe, velocity } = this.swipeDetector.update(smoothed, now, this.waveDetector.hasWavingActivity());
    sharedPointerMapper.process(smoothed);

    let candidateGesture = gestureName || 'Open_Palm';
    if (
      gestureName === 'Swipe_Left' ||
      gestureName === 'Swipe_Right' ||
      gestureName === 'Swipe_Up' ||
      gestureName === 'Swipe_Down'
    ) {
      candidateGesture = gestureName;
    } else if (waveRes.isWave) {
      candidateGesture = 'Wave';
    } else if (swipe) {
      candidateGesture = swipe;
    }

    const { filteredGesture, isTriggered, stabilityProgress, inCooldown } =
      this.filter.process(candidateGesture, 0.95, now);

    let firedAction: GestureAction | string | null = null;
    if (isTriggered && filteredGesture !== 'None' && this.dispatchActionFn) {
      const act = this.dispatchActionFn(filteredGesture, 0.95);
      if (act !== 'NONE') firedAction = act;
    }

    this.state = {
      ...this.state,
      hasHand: true,
      rawGesture: candidateGesture,
      filteredGesture,
      confidence: 0.95,
      lastAction: firedAction || this.state.lastAction,
      inCooldown,
      stabilityProgress,
      holdTimeHeldMs: this.filter.telemetry.holdTimeHeldMs,
      holdRequiredMs: this.filter.telemetry.holdRequiredMs,
      wristVelocity: velocity,
      frameProcessingTimeMs: 4,
      cameraFrameToResultMs: 8,
      whyNotFired: inCooldown ? 'Cooldown active' : 'Stable',
    };

    this.notifySubscribers();
    this.renderFrame();
  }

  public setSimulatedHand(enabled: boolean, pose?: string) {
    this.isSimulatedHand = enabled;
    if (pose) {
      this.simulatedPose = pose;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aerotouch_simulated_hand', String(enabled));
    }

    if (enabled) {
      const runSim = () => {
        if (!this.isSimulatedHand) return;
        const lms = generateSyntheticLandmarks(this.simulatedPos.x, this.simulatedPos.y, this.simulatedPose);
        this.feedSyntheticLandmarks(lms, this.simulatedPose);
      };
      runSim();
      if (!this.simIntervalId) {
        this.simIntervalId = window.setInterval(runSim, 50);
      }
    } else {
      if (this.simIntervalId) {
        clearInterval(this.simIntervalId);
        this.simIntervalId = null;
      }
      if (!this.currentStream) {
        this.latestLandmarks = [];
        this.targetLandmarks = [];
        this.renderedLandmarks = [];
        this.filter.reset();
        this.smoother.reset();
        sharedPointerMapper.reset();
        this.state = {
          ...this.state,
          hasHand: false,
          rawGesture: 'None',
          filteredGesture: 'None',
          confidence: 0,
          whyNotFired: 'Simulated hand disabled',
        };
        this.notifySubscribers();
      }
    }
  }

  public triggerSimulatedSwipe(direction: 'Swipe_Left' | 'Swipe_Right') {
    this.simulatedPose = direction;
    const startX = direction === 'Swipe_Left' ? 0.8 : 0.2;
    const endX = direction === 'Swipe_Left' ? 0.2 : 0.8;
    const duration = 180;
    const tStart = performance.now();

    const anim = () => {
      const elapsed = performance.now() - tStart;
      const progress = Math.min(1, elapsed / duration);
      const currX = startX + (endX - startX) * progress;
      this.simulatedPos = { x: currX, y: 0.5 };
      const lms = generateSyntheticLandmarks(currX, 0.5, 'Open_Palm');
      this.feedSyntheticLandmarks(lms, direction);
      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        setTimeout(() => {
          this.simulatedPose = 'Open_Palm';
        }, 150);
      }
    };
    requestAnimationFrame(anim);
  }

  public async startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      this.state = { ...this.state, isModelLoading: true, modelError: null };
      this.notifySubscribers();

      const recognizer = await getGestureRecognizer();
      this.state = { ...this.state, isModelLoading: false };
      this.notifySubscribers();

      const processFrame = () => {
        if (!this.isRunning) return;

        const video = this.masterVideo;
        if (
          document.visibilityState === 'hidden' ||
          !this.currentStream ||
          !video ||
          video.readyState < 2 ||
          video.paused
        ) {
          this.scheduleNext();
          return;
        }

        const now = Date.now();

        // Throttle FPS calculation (4 Hz / every 250ms)
        this.frameCount++;
        if (now - this.lastFpsUpdate >= 250) {
          const currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
          this.frameCount = 0;
          this.lastFpsUpdate = now;

          if (currentFps < 18 && currentFps > 0) {
            this.lowFpsCounter++;
          } else {
            this.lowFpsCounter = 0;
          }
          const showLowFps = this.lowFpsCounter >= 8;

          if (currentFps !== this.lastNotifiedFps) {
            this.lastNotifiedFps = currentFps;
            this.state = {
              ...this.state,
              fps: currentFps,
              cameraFps: Math.min(30, Math.round(currentFps * 1.5)),
              lowFpsWarning: showLowFps,
            };
            if (this.setDiagnosticsFn) {
              this.setDiagnosticsFn({ fps: currentFps });
            }
            this.notifySubscribers();
          }
        }

        // Process frame only if video time has advanced AND not currently processing
        if (video.currentTime !== this.lastVideoTime && !this.isProcessing) {
          this.isProcessing = true;
          this.lastVideoTime = video.currentTime;
          const tFrameStart = performance.now();

          try {
            // Adaptive detection input size: 448x336 when FPS >= 20, otherwise 320x240
            const targetW = this.state.fps >= 20 ? 448 : 320;
            const targetH = this.state.fps >= 20 ? 336 : 240;
            if (this.offscreenCanvas.width !== targetW || this.offscreenCanvas.height !== targetH) {
              this.offscreenCanvas.width = targetW;
              this.offscreenCanvas.height = targetH;
            }
            if (this.offscreenCtx) {
              this.offscreenCtx.drawImage(video, 0, 0, targetW, targetH);
            }

            const tInferenceStart = performance.now();
            const recognitionResults = recognizer.recognizeForVideo(this.offscreenCanvas, now);
            const inferenceMs = Math.round(performance.now() - tInferenceStart);

            const rawGestures = recognitionResults.gestures;
            const rawLandmarks = recognitionResults.landmarks;

            if (rawLandmarks && rawLandmarks.length > 0 && rawLandmarks[0].length === 21) {
              this.lastHandSeenTime = now;
              if (this.recordHandPresenceFn) this.recordHandPresenceFn(true);
              const currentLandmarks = rawLandmarks[0];

              // Smooth landmarks
              const smoothedLandmarks = this.smoother.smooth(currentLandmarks, now);
              this.latestLandmarks = smoothedLandmarks;

              // Feed to 60 FPS continuous render loop
              const tNow = performance.now();
              const dt = Math.max(1, tNow - this.lastLandmarksTime);
              this.lastLandmarksTime = tNow;

              if (this.targetLandmarks.length === 21) {
                for (let i = 0; i < 21; i++) {
                  this.jointVelocities[i] = {
                    vx: (smoothedLandmarks[i].x - this.targetLandmarks[i].x) / (dt / 1000),
                    vy: (smoothedLandmarks[i].y - this.targetLandmarks[i].y) / (dt / 1000),
                    vz: (smoothedLandmarks[i].z - this.targetLandmarks[i].z) / (dt / 1000),
                  };
                }
              } else {
                this.jointVelocities = Array.from({ length: 21 }, () => ({ vx: 0, vy: 0, vz: 0 }));
              }
              this.targetLandmarks = smoothedLandmarks;

              // Wave detection
              const waveRes = this.waveDetector.update(smoothedLandmarks, now);

              // Swipe detection (suppressed if waving activity is detected)
              const { swipe, velocity } = this.swipeDetector.update(
                smoothedLandmarks,
                now,
                this.waveDetector.hasWavingActivity()
              );

              // Pointer mapping
              sharedPointerMapper.process(smoothedLandmarks);

              // KNN Custom Gesture
              const knnMatch = customKNN.classify(smoothedLandmarks);

              // Top 3 MediaPipe categories
              const topCategories: GestureCategoryScore[] = [];
              if (rawGestures && rawGestures.length > 0 && rawGestures[0].length > 0) {
                const cats = rawGestures[0];
                for (let i = 0; i < Math.min(cats.length, 3); i++) {
                  topCategories.push({
                    categoryName: cats[i].categoryName,
                    score: cats[i].score,
                  });
                }
              }

              let candidateGesture = 'None';
              let candidateScore = 0;
              let isCustom = false;

              if (waveRes.isWave) {
                candidateGesture = 'Wave';
                candidateScore = 0.96;
              } else if (knnMatch) {
                candidateGesture = knnMatch.gestureName;
                candidateScore = knnMatch.confidence;
                isCustom = true;
              } else if (swipe) {
                candidateGesture = swipe;
                candidateScore = 0.95;
              } else if (topCategories.length > 0) {
                let bestValidCategory: GestureCategoryScore | null = null;
                for (const cat of topCategories) {
                  if (cat.categoryName !== 'None' && cat.categoryName !== '') {
                    const reqThreshold = this.filter.getThresholdFor(cat.categoryName);
                    if (cat.score >= reqThreshold) {
                      bestValidCategory = cat;
                      break;
                    }
                  }
                }

                if (bestValidCategory) {
                  candidateGesture = bestValidCategory.categoryName;
                  candidateScore = bestValidCategory.score;
                } else {
                  candidateGesture = topCategories[0].categoryName;
                  candidateScore = topCategories[0].score;
                }
              }

              // Time-based gesture filter
              const { filteredGesture, isTriggered, stabilityProgress, inCooldown } =
                this.filter.process(candidateGesture, candidateScore, now);

              // Action Dispatch
              let firedAction: GestureAction | string | null = null;
              if (isTriggered && filteredGesture !== 'None') {
                if (this.dispatchActionFn) {
                  const action = this.dispatchActionFn(filteredGesture, candidateScore);
                  if (action !== 'NONE') {
                    firedAction = action;
                  }
                }
              }

              const frameToResultMs = Math.round(performance.now() - tFrameStart);

              const currentReason = this.waveDetector.telemetry.inCooldown
                ? this.waveDetector.telemetry.whyNotFired
                : this.swipeDetector.telemetry.inCooldown
                  ? this.swipeDetector.telemetry.whyNotFired
                  : this.filter.telemetry.whyNotFired;

              // Update state
              this.state = {
                ...this.state,
                hasHand: true,
                rawGesture: candidateGesture,
                filteredGesture,
                confidence: candidateScore,
                lastAction: firedAction || this.state.lastAction,
                inCooldown,
                stabilityProgress,
                holdTimeHeldMs: this.filter.telemetry.holdTimeHeldMs,
                holdRequiredMs: this.filter.telemetry.holdRequiredMs,
                wristVelocity: velocity,
                frameProcessingTimeMs: inferenceMs,
                cameraFrameToResultMs: frameToResultMs,
                isCustomGesture: isCustom,
                top3Categories: topCategories,
                swipeTelemetry: { ...this.swipeDetector.telemetry },
                waveTelemetry: { ...this.waveDetector.telemetry },
                whyNotFired: currentReason,
              };

              if (this.setDiagnosticsFn) {
                this.setDiagnosticsFn({ inferenceMs, handsDetected: 1 });
              }

              // Notify subscribers
              if (
                candidateGesture !== this.lastNotifiedGesture ||
                !this.lastNotifiedHand ||
                firedAction !== null
              ) {
                this.lastNotifiedGesture = candidateGesture;
                this.lastNotifiedHand = true;
                this.notifySubscribers();
              }
            } else {
              // No hand detected
              if (this.recordHandPresenceFn) this.recordHandPresenceFn(false);
              this.smoother.reset();
              this.swipeDetector.reset();
              this.waveDetector.reset();
              this.filter.reset();
              sharedPointerMapper.reset();
              this.latestLandmarks = [];
              this.targetLandmarks = [];

              if (this.lastNotifiedHand) {
                this.lastNotifiedHand = false;
                this.lastNotifiedGesture = 'None';
                this.state = {
                  ...this.state,
                  hasHand: false,
                  rawGesture: 'None',
                  filteredGesture: 'None',
                  confidence: 0,
                  stabilityProgress: 0,
                  holdTimeHeldMs: 0,
                  frameProcessingTimeMs: 0,
                  drawTimeMs: 0,
                  isCustomGesture: false,
                  top3Categories: [],
                  swipeTelemetry: { ...this.swipeDetector.telemetry },
                  waveTelemetry: { ...this.waveDetector.telemetry },
                  whyNotFired: 'No hand detected',
                };
                if (this.setDiagnosticsFn) {
                  this.setDiagnosticsFn({ handsDetected: 0 });
                }
                this.notifySubscribers();
              }
            }
          } finally {
            this.isProcessing = false;
          }
        }

        this.scheduleNext();
      };

      this.scheduleNext = () => {
        if (!this.isRunning) return;
        if ('requestVideoFrameCallback' in this.masterVideo) {
          this.callbackId = (this.masterVideo as unknown as HTMLVideoElementWithCallback).requestVideoFrameCallback(processFrame);
        } else {
          this.animFrameId = requestAnimationFrame(processFrame);
        }
      };

      this.scheduleNext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.state = { ...this.state, isModelLoading: false, modelError: msg };
      this.notifySubscribers();
    }
  }

  private scheduleNext: () => void = () => { };

  public stopLoop() {
    this.isRunning = false;
    if (this.callbackId !== null && 'cancelVideoFrameCallback' in this.masterVideo) {
      (this.masterVideo as unknown as HTMLVideoElementWithCallback).cancelVideoFrameCallback(this.callbackId);
      this.callbackId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isProcessing = false;
  }
}

export const masterGestureEngine = MasterGestureEngine.getInstance();
