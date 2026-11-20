import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * Clamps volume to integer in [0, 100] range
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(100, Math.round(volume)));
}

/**
 * Clamps volume to float in [0.0, 1.0] range
 */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Steps volume by delta (e.g. +10 or -10) with clamping
 */
export function stepVolume(current: number, delta: number): number {
  return clampVolume(current + delta);
}

/**
 * Steps normalized volume (0..1) by delta (e.g. +0.10 or -0.10)
 */
export function stepVolume01(current: number, delta: number): number {
  return clamp01(Math.round((current + delta) * 100) / 100);
}

/**
 * Determines if repeat rate allows a new volume step (400ms throttle)
 */
export function canRepeatVolumeStep(
  lastStepTimestamp: number,
  currentTimestamp: number,
  repeatIntervalMs: number = 400
): boolean {
  return currentTimestamp - lastStepTimestamp >= repeatIntervalMs;
}

/**
 * Relative two-finger volume formula:
 * volume = clamp(anchorVolume + (anchorY - currentY) * 1.6, 0, 1)
 *
 * In screen/camera coordinates, Y=0 is top, Y=1 is bottom.
 * Moving fingertips UP (currentY < anchorY) increases volume.
 * Moving fingertips DOWN (currentY > anchorY) decreases volume.
 */
export function calculateTwoFingerVolume(
  anchorVolume: number,
  anchorY: number,
  currentY: number,
  scale: number = 1.6
): number {
  return clamp01(anchorVolume + (anchorY - currentY) * scale);
}

/**
 * Detects whether the hand is making a V sign (Victory / two fingers extended).
 * Checks gesture name or landmark finger posture:
 * Index (8) & Middle (12) tips extended above their PIPs (6, 10),
 * Ring (16) & Pinky (20) tips folded below their PIPs (14, 18).
 */
export function isVSignGesture(
  landmarks?: NormalizedLandmark[] | null,
  gestureName?: string
): boolean {
  if (gestureName === 'Victory') return true;
  if (!landmarks || landmarks.length < 21) return false;

  const indexExtended = landmarks[8].y < landmarks[6].y;
  const middleExtended = landmarks[12].y < landmarks[10].y;
  const ringFolded = landmarks[16].y > landmarks[14].y;
  const pinkyFolded = landmarks[20].y > landmarks[18].y;

  return indexExtended && middleExtended && ringFolded && pinkyFolded;
}

/**
 * Calculates palm span between wrist (0) and middle MCP (9)
 */
export function calculatePalmSpan(landmarks: NormalizedLandmark[]): number {
  if (!landmarks || landmarks.length < 21) return 1;
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const span = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
  return Math.max(0.01, span);
}

/**
 * Calculates pinch ratio (distance between thumb tip and index tip divided by palm span)
 */
export function calculatePinchRatio(landmarks: NormalizedLandmark[]): number {
  if (!landmarks || landmarks.length < 21) return 1;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const span = calculatePalmSpan(landmarks);
  return dist / span;
}

/**
 * Detects pinch: thumb tip and index tip closer than 0.30 of palm span
 */
export function isPinch(landmarks: NormalizedLandmark[], threshold: number = 0.30): boolean {
  return calculatePinchRatio(landmarks) <= threshold;
}

/**
 * Maps vertical position of pinch to 0..100% volume
 */
export function pinchYToVolume(
  normY: number,
  minY: number = 0.20,
  maxY: number = 0.80
): number {
  if (maxY <= minY) return 50;
  const fraction = (maxY - normY) / (maxY - minY);
  return clampVolume(fraction * 100);
}

/**
 * Maps fingertip distance ratio to volume:
 * Small gap (minGap, e.g. 0.15) = quiet (0%)
 * Wide gap (maxGap, e.g. 0.65) = loud (100%)
 */
export function distanceToVolume(
  pinchRatio: number,
  minGap: number = 0.15,
  maxGap: number = 0.65
): number {
  if (maxGap <= minGap) return 50;
  const fraction = (pinchRatio - minGap) / (maxGap - minGap);
  return clampVolume(fraction * 100);
}

/**
 * Classic One-Euro Filter (Casiez et al., CHI 2012)
 * Adaptive 1st-order low-pass filter minimizing jitter at low speeds
 * and latency at high speeds.
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, timestamp: number = Date.now()): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = timestamp;
      this.xPrev = x;
      this.dxPrev = 0;
      return x;
    }

    const dt = Math.max((timestamp - this.tPrev) / 1000, 0.001);
    this.tPrev = timestamp;

    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }

  reset(x?: number): void {
    this.xPrev = x !== undefined ? x : null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/**
 * Lightweight Exponential smoothing filter for backward compatibility
 */
export class VolumeSmoother {
  private currentVolume: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.25) {
    this.alpha = alpha;
  }

  filter(rawVolume: number): number {
    if (this.currentVolume === null) {
      this.currentVolume = rawVolume;
      return clampVolume(rawVolume);
    }
    this.currentVolume = this.currentVolume + this.alpha * (rawVolume - this.currentVolume);
    return clampVolume(this.currentVolume);
  }

  reset(initialValue?: number) {
    this.currentVolume = initialValue !== undefined ? initialValue : null;
  }
}

export interface TwoFingerVolumeState {
  isActive: boolean;
  volume: number; // 0.0 to 1.0
  volumePercent: number; // 0 to 100
  caption: string; // e.g. "Volume 60%"
}

/**
 * Two-Finger Volume Tracker
 * - Enters mode when V sign is held for >= 300 ms
 * - Tracks average fingertip Y of index (8) & middle (12), smoothed with One-Euro filter
 * - Relative adjustment: volume = clamp(anchorVolume + (anchorY - currentY) * 1.6, 0, 1)
 * - Exits mode when V sign is absent for >= 450 ms
 * - Fires onModeExit to allow persistence to IndexedDB
 */
export class TwoFingerVolumeTracker {
  public isActive: boolean = false;
  public anchorVolume: number = 0.75;
  public anchorY: number = 0.5;
  public currentVolume: number = 0.75;
  private vSignStartTimestamp: number | null = null;
  private vSignLostTimestamp: number | null = null;
  private filter: OneEuroFilter;
  public onVolumeChange?: (volume: number, percent: number) => void;
  public onModeExit?: (finalVolume: number, percent: number) => void;

  constructor(
    initialVolume: number = 0.75,
    callbacks?: {
      onVolumeChange?: (volume: number, percent: number) => void;
      onModeExit?: (finalVolume: number, percent: number) => void;
    }
  ) {
    this.currentVolume = clamp01(initialVolume);
    this.anchorVolume = this.currentVolume;
    this.filter = new OneEuroFilter(1.2, 0.01);
    this.onVolumeChange = callbacks?.onVolumeChange;
    this.onModeExit = callbacks?.onModeExit;
  }

  setVolume(vol: number): void {
    this.currentVolume = clamp01(vol);
    this.anchorVolume = this.currentVolume;
  }

  process(
    landmarks: NormalizedLandmark[] | null | undefined,
    gestureName?: string,
    now: number = Date.now()
  ): TwoFingerVolumeState {
    const isV = isVSignGesture(landmarks, gestureName);

    if (isV && landmarks && landmarks.length >= 21) {
      this.vSignLostTimestamp = null;
      const rawY = (landmarks[8].y + landmarks[12].y) / 2;

      if (!this.isActive) {
        if (this.vSignStartTimestamp === null) {
          this.vSignStartTimestamp = now;
        } else if (now - this.vSignStartTimestamp >= 300) {
          // ENTER volume mode!
          this.isActive = true;
          this.anchorVolume = this.currentVolume;
          this.anchorY = rawY;
          this.filter.reset(rawY);
        }
      } else {
        // Mode is active, update volume
        const smoothedY = this.filter.filter(rawY, now);
        const newVol = calculateTwoFingerVolume(this.anchorVolume, this.anchorY, smoothedY, 1.6);
        this.currentVolume = newVol;
        if (this.onVolumeChange) {
          this.onVolumeChange(newVol, Math.round(newVol * 100));
        }
      }
    } else {
      // V sign lost
      this.vSignStartTimestamp = null;
      if (this.isActive) {
        if (this.vSignLostTimestamp === null) {
          this.vSignLostTimestamp = now;
        } else if (now - this.vSignLostTimestamp >= 450) {
          // LEAVE volume mode!
          this.isActive = false;
          this.vSignLostTimestamp = null;
          if (this.onModeExit) {
            this.onModeExit(this.currentVolume, Math.round(this.currentVolume * 100));
          }
        }
      }
    }

    const percent = Math.round(this.currentVolume * 100);
    return {
      isActive: this.isActive,
      volume: this.currentVolume,
      volumePercent: percent,
      caption: `Volume ${percent}%`,
    };
  }
}
