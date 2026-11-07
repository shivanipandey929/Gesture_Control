import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * 1€ Filter (One Euro Filter) implementation for low-latency jitter reduction
 * Reference: Casiez et al., CHI 2012
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.s = alpha * value + (1.0 - alpha) * (this.s ?? value);
    this.y = this.s;
    return this.y;
  }

  hasLast(): boolean {
    return this.y !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dcutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dcutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(x: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(x, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 0.001);
    this.lastTime = timestamp;
    const rate = 1.0 / dt;

    const dx = this.xFilter.hasLast() ? (x - this.xFilter.last()) * rate : 0;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dcutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.filter(x, this.alpha(rate, cutoff));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * Multi-dimensional landmark smoother holding 21 x 3 filters (x, y, z)
 */
export class LandmarkSmoother {
  private filters: { x: OneEuroFilter; y: OneEuroFilter; z: OneEuroFilter }[] = [];

  constructor() {
    for (let i = 0; i < 21; i++) {
      this.filters.push({
        x: new OneEuroFilter(1.2, 0.015, 1.0),
        y: new OneEuroFilter(1.2, 0.015, 1.0),
        z: new OneEuroFilter(1.2, 0.015, 1.0),
      });
    }
  }

  smooth(landmarks: NormalizedLandmark[], timestamp: number): NormalizedLandmark[] {
    if (!landmarks || landmarks.length !== 21) {
      return landmarks;
    }

    return landmarks.map((lm, idx) => {
      const f = this.filters[idx];
      return {
        x: f.x.filter(lm.x, timestamp),
        y: f.y.filter(lm.y, timestamp),
        z: f.z.filter(lm.z ?? 0, timestamp),
        visibility: lm.visibility,
      };
    });
  }

  reset() {
    this.filters.forEach((f) => {
      f.x.reset();
      f.y.reset();
      f.z.reset();
    });
  }
}

