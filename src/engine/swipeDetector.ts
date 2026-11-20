import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type SwipeSensitivity = 'relaxed' | 'normal' | 'strict';

export interface SwipeSensitivityConfig {
  minTravel: number; // in fraction of frame width
  minSpeed: number;  // in frame widths per second
  maxDurationMs: number;
}

export const SWIPE_CONFIGS: Record<SwipeSensitivity, SwipeSensitivityConfig> = {
  relaxed: { minTravel: 0.20, minSpeed: 0.45, maxDurationMs: 450 },
  normal: { minTravel: 0.25, minSpeed: 0.60, maxDurationMs: 450 },
  strict: { minTravel: 0.30, minSpeed: 0.75, maxDurationMs: 400 },
};

interface PositionSample {
  x: number; // Mirrored X (0..1)
  y: number; // Normalized Y (0..1)
  timestamp: number; // ms
}

export interface SwipeTelemetry {
  currentTravelX: number;
  currentSpeed: number;
  targetTravelX: number;
  targetSpeed: number;
  extendedFingers: number;
  inCooldown: boolean;
  cooldownRemainingMs: number;
  whyNotFired: string;
}

export class SwipeDetector {
  private history: PositionSample[] = [];
  private readonly historyWindowMs = 500;
  private readonly cooldownMs = 700;
  private lastSwipeTime = -100000;
  private sensitivity: SwipeSensitivity = 'relaxed';
  private customMinSpeed?: number;

  public telemetry: SwipeTelemetry = {
    currentTravelX: 0,
    currentSpeed: 0,
    targetTravelX: SWIPE_CONFIGS.relaxed.minTravel,
    targetSpeed: SWIPE_CONFIGS.relaxed.minSpeed,
    extendedFingers: 0,
    inCooldown: false,
    cooldownRemainingMs: 0,
    whyNotFired: 'Waiting for hand motion',
  };

  constructor(sensitivityOrSpeed: SwipeSensitivity | number = 'relaxed') {
    if (typeof sensitivityOrSpeed === 'number') {
      this.sensitivity = 'relaxed';
      this.customMinSpeed = sensitivityOrSpeed;
      this.telemetry.targetTravelX = SWIPE_CONFIGS.relaxed.minTravel;
      this.telemetry.targetSpeed = sensitivityOrSpeed;
    } else {
      this.setSensitivity(sensitivityOrSpeed);
    }
  }

  setSensitivity(s: SwipeSensitivity | number) {
    if (typeof s === 'number') {
      this.sensitivity = 'relaxed';
      this.customMinSpeed = s;
      this.telemetry.targetTravelX = SWIPE_CONFIGS.relaxed.minTravel;
      this.telemetry.targetSpeed = s;
      return;
    }
    this.sensitivity = s;
    this.customMinSpeed = undefined;
    const cfg = SWIPE_CONFIGS[s] || SWIPE_CONFIGS.relaxed;
    this.telemetry.targetTravelX = cfg.minTravel;
    this.telemetry.targetSpeed = cfg.minSpeed;
  }

  getSensitivity(): SwipeSensitivity {
    return this.sensitivity;
  }

  /**
   * Calculates mirrored palm center (average of landmarks 0, 5, 9, 13, 17)
   */
  public static calculatePalmCenter(landmarks: NormalizedLandmark[]): { x: number; y: number } {
    const indices = [0, 5, 9, 13, 17];
    let sumX = 0;
    let sumY = 0;
    for (const idx of indices) {
      sumX += landmarks[idx].x;
      sumY += landmarks[idx].y;
    }
    const rawX = sumX / indices.length;
    const rawY = sumY / indices.length;
    // Mirrored so user moving hand to physical right increases mirrored X
    return { x: 1 - rawX, y: rawY };
  }

  /**
   * Counts extended fingers (Index, Middle, Ring, Pinky, Thumb)
   */
  public static countExtendedFingers(landmarks: NormalizedLandmark[]): number {
    if (!landmarks || landmarks.length < 21) return 0;

    let count = 0;
    const wrist = landmarks[0];

    const dist = (p1: NormalizedLandmark, p2: NormalizedLandmark) =>
      Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // Thumb: tip (4) vs MCP (2)
    if (dist(landmarks[4], wrist) > dist(landmarks[2], wrist) * 1.15) {
      count++;
    }

    // Index: tip (8) vs PIP (6)
    if (dist(landmarks[8], wrist) > dist(landmarks[6], wrist) * 1.15) {
      count++;
    }

    // Middle: tip (12) vs PIP (10)
    if (dist(landmarks[12], wrist) > dist(landmarks[10], wrist) * 1.15) {
      count++;
    }

    // Ring: tip (16) vs PIP (14)
    if (dist(landmarks[16], wrist) > dist(landmarks[14], wrist) * 1.15) {
      count++;
    }

    // Pinky: tip (20) vs PIP (18)
    if (dist(landmarks[20], wrist) > dist(landmarks[18], wrist) * 1.15) {
      count++;
    }

    return count;
  }

  update(
    landmarks: NormalizedLandmark[],
    timestamp: number,
    suppressSwipe: boolean = false
  ): { swipe: 'Swipe_Left' | 'Swipe_Right' | 'Swipe_Up' | 'Swipe_Down' | null; velocity: { vx: number; vy: number } } {
    if (!landmarks || landmarks.length < 21) {
      this.history = [];
      this.telemetry.whyNotFired = 'No hand detected';
      this.telemetry.extendedFingers = 0;
      return { swipe: null, velocity: { vx: 0, vy: 0 } };
    }

    const palm = SwipeDetector.calculatePalmCenter(landmarks);
    const extendedCount = SwipeDetector.countExtendedFingers(landmarks);
    this.telemetry.extendedFingers = extendedCount;

    this.history.push({ x: palm.x, y: palm.y, timestamp });

    // Prune samples older than 500ms
    this.history = this.history.filter((s) => timestamp - s.timestamp <= this.historyWindowMs);

    // Cooldown check (700 ms)
    const timeSinceLastSwipe = timestamp - this.lastSwipeTime;
    const inCooldown = timeSinceLastSwipe < this.cooldownMs;
    this.telemetry.inCooldown = inCooldown;
    this.telemetry.cooldownRemainingMs = inCooldown ? this.cooldownMs - timeSinceLastSwipe : 0;

    if (this.history.length < 2) {
      this.telemetry.whyNotFired = 'Collecting motion history';
      return { swipe: null, velocity: { vx: 0, vy: 0 } };
    }

    const cfg = SWIPE_CONFIGS[this.sensitivity];
    const newest = this.history[this.history.length - 1];

    // Find the best window within maxDurationMs (450ms)
    let bestDx = 0;
    let bestDy = 0;
    let bestDt = 0;
    let bestSpeedX = 0;
    let bestSpeedY = 0;

    for (let i = 0; i < this.history.length - 1; i++) {
      const sample = this.history[i];
      const dtMs = newest.timestamp - sample.timestamp;
      if (dtMs <= cfg.maxDurationMs && dtMs >= 50) {
        const dtSec = dtMs / 1000;
        const dx = newest.x - sample.x;
        const dy = newest.y - sample.y;
        const speedX = Math.abs(dx) / dtSec;
        const speedY = Math.abs(dy) / dtSec;

        if (Math.abs(dx) > Math.abs(bestDx)) {
          bestDx = dx;
          bestSpeedX = speedX;
        }
        if (Math.abs(dy) > Math.abs(bestDy)) {
          bestDy = dy;
          bestSpeedY = speedY;
        }
        bestDt = dtSec;
      }
    }

    this.telemetry.currentTravelX = Math.max(Math.abs(bestDx), Math.abs(bestDy));
    this.telemetry.currentSpeed = Math.max(bestSpeedX, bestSpeedY);

    const vx = bestDt > 0 ? bestDx / bestDt : 0;
    const vy = bestDt > 0 ? bestDy / bestDt : 0;

    if (inCooldown) {
      this.telemetry.whyNotFired = `Cooldown active (${this.telemetry.cooldownRemainingMs}ms)`;
      return { swipe: null, velocity: { vx, vy } };
    }

    if (extendedCount < 3) {
      this.telemetry.whyNotFired = `Need at least 3 fingers open (${extendedCount}/3)`;
      return { swipe: null, velocity: { vx, vy } };
    }

    const absDx = Math.abs(bestDx);
    const absDy = Math.abs(bestDy);
    const thresholdSpeed = this.customMinSpeed ?? cfg.minSpeed;

    // Check horizontal swipe
    const isHorizontal = absDx >= cfg.minTravel && absDx >= 1.5 * absDy && bestSpeedX >= thresholdSpeed;
    // Check vertical swipe
    const isVertical = absDy >= cfg.minTravel && absDy >= 1.5 * absDx && bestSpeedY >= thresholdSpeed;

    if (!isHorizontal && !isVertical) {
      if (absDx < cfg.minTravel && absDy < cfg.minTravel) {
        this.telemetry.whyNotFired = `Travel too short (dx: ${absDx.toFixed(2)}, dy: ${absDy.toFixed(2)} / ${cfg.minTravel.toFixed(2)})`;
      } else if (bestSpeedX < thresholdSpeed && bestSpeedY < thresholdSpeed) {
        this.telemetry.whyNotFired = `Swipe too slow (${Math.max(bestSpeedX, bestSpeedY).toFixed(2)} / ${thresholdSpeed.toFixed(2)})`;
      } else {
        this.telemetry.whyNotFired = 'Motion not directional enough (diagonal)';
      }
      return { swipe: null, velocity: { vx: -vx, vy } };
    }

    if (suppressSwipe) {
      this.telemetry.whyNotFired = 'Suppressed by waving activity';
      return { swipe: null, velocity: { vx: -vx, vy } };
    }

    // Trigger swipe!
    this.lastSwipeTime = timestamp;
    this.telemetry.inCooldown = true;
    this.telemetry.whyNotFired = 'Swipe fired!';
    this.history = [];

    let swipe: 'Swipe_Left' | 'Swipe_Right' | 'Swipe_Up' | 'Swipe_Down';
    if (isHorizontal) {
      swipe = bestDx > 0 ? 'Swipe_Right' : 'Swipe_Left';
    } else {
      swipe = bestDy < 0 ? 'Swipe_Up' : 'Swipe_Down';
    }

    return { swipe, velocity: { vx: -vx, vy } };
  }

  reset() {
    this.history = [];
    this.lastSwipeTime = -100000;
    this.telemetry.whyNotFired = 'Reset';
  }
}
