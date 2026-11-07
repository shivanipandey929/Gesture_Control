import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface PositionSample {
  x: number;
  y: number;
  timestamp: number;
}

export class SwipeDetector {
  private history: PositionSample[] = [];
  private readonly windowMs = 280;
  private readonly minVelocity = 0.85; // normalized units per second
  private readonly minDistance = 0.14; // minimum horizontal travel
  private lastSwipeTime = 0;
  private readonly swipeCooldownMs = 650;

  /**
   * Evaluates wrist / palm positions over time and returns 'Swipe_Left' | 'Swipe_Right' | null
   */
  update(
    landmarks: NormalizedLandmark[],
    timestamp: number
  ): { swipe: 'Swipe_Left' | 'Swipe_Right' | null; velocity: { vx: number; vy: number } } {
    if (!landmarks || landmarks.length === 0) {
      this.history = [];
      return { swipe: null, velocity: { vx: 0, vy: 0 } };
    }

    // Wrist is landmark 0
    const wrist = landmarks[0];
    this.history.push({ x: wrist.x, y: wrist.y, timestamp });

    // Prune old samples
    this.history = this.history.filter((s) => timestamp - s.timestamp <= this.windowMs);

    if (this.history.length < 3) {
      return { swipe: null, velocity: { vx: 0, vy: 0 } };
    }

    const oldest = this.history[0];
    const newest = this.history[this.history.length - 1];
    const dtSeconds = (newest.timestamp - oldest.timestamp) / 1000;

    if (dtSeconds <= 0.05) {
      return { swipe: null, velocity: { vx: 0, vy: 0 } };
    }

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const vx = dx / dtSeconds;
    const vy = dy / dtSeconds;

    // Check cooldown
    if (timestamp - this.lastSwipeTime < this.swipeCooldownMs) {
      return { swipe: null, velocity: { vx, vy } };
    }

    // Significant horizontal movement with speed and dominance over vertical movement
    const isDominantlyHorizontal = Math.abs(dx) > Math.abs(dy) * 1.35;
    const isFastEnough = Math.abs(vx) >= this.minVelocity;
    const isFarEnough = Math.abs(dx) >= this.minDistance;

    if (isDominantlyHorizontal && isFastEnough && isFarEnough) {
      this.lastSwipeTime = timestamp;
      // In mirrored video: moving hand to user's right means x decreases in camera or increases depending on mirroring
      // Here: dx < 0 means moving towards the left in normalized space, dx > 0 to right.
      // With mirrored camera feed: moving hand rightwards makes x decrease, so we flip to match physical motion
      const swipe: 'Swipe_Left' | 'Swipe_Right' = dx < 0 ? 'Swipe_Right' : 'Swipe_Left';
      this.history = [];
      return { swipe, velocity: { vx, vy } };
    }

    return { swipe: null, velocity: { vx, vy } };
  }

  reset() {
    this.history = [];
    this.lastSwipeTime = 0;
  }
}

