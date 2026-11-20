import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { SwipeDetector } from './swipeDetector';

export interface WaveTelemetry {
  reversalsCount: number;
  currentSwingWidth: number;
  targetSwingWidth: number;
  inCooldown: boolean;
  cooldownRemainingMs: number;
  whyNotFired: string;
}

interface MotionSample {
  x: number;
  y: number;
  timestamp: number;
}

interface ReversalPoint {
  x: number;
  timestamp: number;
  direction: 'left' | 'right';
}

export class WaveDetector {
  private history: MotionSample[] = [];
  private readonly windowMs = 1400; // 1.4s
  private readonly minSwing = 0.06; // at least 6% of frame width
  private readonly cooldownMs = 1500; // 1.5s
  private lastWaveTime = -100000;

  public telemetry: WaveTelemetry = {
    reversalsCount: 0,
    currentSwingWidth: 0,
    targetSwingWidth: 0.06,
    inCooldown: false,
    cooldownRemainingMs: 0,
    whyNotFired: 'Waiting for hand waving',
  };

  /**
   * Returns true if 2 or more reversals are detected in progress,
   * used to suppress single directional swipes.
   */
  public hasWavingActivity(): boolean {
    return this.telemetry.reversalsCount >= 2;
  }

  public update(
    landmarks: NormalizedLandmark[],
    timestamp: number
  ): { isWave: boolean } {
    if (!landmarks || landmarks.length < 21) {
      this.history = [];
      this.telemetry.reversalsCount = 0;
      this.telemetry.currentSwingWidth = 0;
      this.telemetry.whyNotFired = 'No hand detected';
      return { isWave: false };
    }

    const extendedFingers = SwipeDetector.countExtendedFingers(landmarks);
    const palm = SwipeDetector.calculatePalmCenter(landmarks);

    // Cooldown check
    const timeSinceLast = timestamp - this.lastWaveTime;
    const inCooldown = timeSinceLast < this.cooldownMs;
    this.telemetry.inCooldown = inCooldown;
    this.telemetry.cooldownRemainingMs = inCooldown ? this.cooldownMs - timeSinceLast : 0;

    if (inCooldown) {
      this.telemetry.whyNotFired = `Cooldown active (${this.telemetry.cooldownRemainingMs}ms)`;
      return { isWave: false };
    }

    if (extendedFingers < 4) {
      this.history = [];
      this.telemetry.reversalsCount = 0;
      this.telemetry.currentSwingWidth = 0;
      this.telemetry.whyNotFired = `Need at least 4 open fingers (${extendedFingers}/4)`;
      return { isWave: false };
    }

    // Add sample
    this.history.push({ x: palm.x, y: palm.y, timestamp });

    // Filter to window of 1400ms
    this.history = this.history.filter((s) => timestamp - s.timestamp <= this.windowMs);

    if (this.history.length < 4) {
      this.telemetry.whyNotFired = 'Collecting wave history';
      return { isWave: false };
    }

    // Identify inflection points / direction reversals
    // Step through history and detect when direction changes from increasing X to decreasing X (or vice-versa)
    const reversals: ReversalPoint[] = [];
    let currentDir: 'left' | 'right' | null = null;
    let extremeX = this.history[0].x;
    let maxSwingSoFar = 0;

    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1];
      const curr = this.history[i];
      const dx = curr.x - prev.x;

      if (Math.abs(dx) > 0.003) {
        const stepDir: 'left' | 'right' = dx > 0 ? 'right' : 'left';

        if (currentDir === null) {
          currentDir = stepDir;
          extremeX = prev.x;
        } else if (currentDir !== stepDir) {
          // Check swing width from previous extreme
          const swing = Math.abs(prev.x - extremeX);
          maxSwingSoFar = Math.max(maxSwingSoFar, swing);

          if (swing >= this.minSwing) {
            reversals.push({
              x: prev.x,
              timestamp: prev.timestamp,
              direction: currentDir,
            });
            currentDir = stepDir;
            extremeX = prev.x;
          }
        } else {
          // Continuing in same direction, update extreme
          if (currentDir === 'right' && curr.x > extremeX) {
            extremeX = curr.x;
          } else if (currentDir === 'left' && curr.x < extremeX) {
            extremeX = curr.x;
          }
        }
      }
    }

    // Check ongoing swing
    const lastSample = this.history[this.history.length - 1];
    const ongoingSwing = Math.abs(lastSample.x - extremeX);
    maxSwingSoFar = Math.max(maxSwingSoFar, ongoingSwing);

    this.telemetry.currentSwingWidth = maxSwingSoFar;
    this.telemetry.reversalsCount = reversals.length;

    if (reversals.length < 3) {
      this.telemetry.whyNotFired = `Need 3 direction reversals (${reversals.length}/3, swing ${maxSwingSoFar.toFixed(2)})`;
      return { isWave: false };
    }

    // Trigger Wave!
    this.lastWaveTime = timestamp;
    this.history = [];
    this.telemetry.inCooldown = true;
    this.telemetry.reversalsCount = 3;
    this.telemetry.whyNotFired = 'Wave detected!';
    return { isWave: true };
  }

  public reset() {
    this.history = [];
    this.lastWaveTime = -100000;
    this.telemetry.reversalsCount = 0;
    this.telemetry.currentSwingWidth = 0;
    this.telemetry.inCooldown = false;
    this.telemetry.whyNotFired = 'Reset';
  }
}
