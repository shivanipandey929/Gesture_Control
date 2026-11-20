import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface DrawPoint {
  x: number;
  y: number;
  time: number;
}

export interface DrawStroke {
  id: string;
  points: DrawPoint[];
  color: string;
  size: number;
  isEraser: boolean;
}

export type StabilizerLevel = 'off' | 'low' | 'medium' | 'high';
export type PenTriggerMode = 'pinch' | 'pointing';

/**
 * 1D One-Euro Filter implementation for smooth low-latency pointer motion.
 */
class OneEuroFilter1D {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.01, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  public filter(x: number, timestamp: number): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.tPrev = timestamp;
      return x;
    }

    const dt = Math.max(1, timestamp - this.tPrev) / 1000;
    this.tPrev = timestamp;

    const dx = (x - this.xPrev) / dt;
    const edx = this.alpha(dt, this.dCutoff) * dx + (1 - this.alpha(dt, this.dCutoff)) * this.dxPrev;
    this.dxPrev = edx;

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this.alpha(dt, cutoff);
    const xFiltered = a * x + (1 - a) * this.xPrev;
    this.xPrev = xFiltered;
    return xFiltered;
  }

  private alpha(dt: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }
}

/**
 * Air Draw State Machine & Smoothing Pipeline
 */
export class AirDrawStateMachine {
  public state: 'up' | 'pending_down' | 'down' = 'up';
  public penMode: PenTriggerMode = 'pointing';
  public stabilizer: StabilizerLevel = 'medium';

  // Thresholds
  public readonly PINCH_START = 0.30;
  public readonly PINCH_STOP = 0.42;
  public readonly COMMIT_DELAY_MS = 100;
  public readonly TELEPORT_FRACTION = 0.25;
  public readonly DEADZONE_PX = 3;

  public currentPinchRatio: number = 0;

  private pendingStartTime: number = 0;
  private lastCommittedPoint: DrawPoint | null = null;

  // Filters
  private filterX = new OneEuroFilter1D(0.6, 0.01);
  private filterY = new OneEuroFilter1D(0.6, 0.01);

  constructor(penMode: PenTriggerMode = 'pointing', stabilizer: StabilizerLevel = 'medium') {
    this.penMode = penMode;
    this.setStabilizer(stabilizer);
  }

  public setStabilizer(level: StabilizerLevel) {
    this.stabilizer = level;
    if (level === 'off') {
      this.filterX = new OneEuroFilter1D(30.0, 0.0);
      this.filterY = new OneEuroFilter1D(30.0, 0.0);
    } else if (level === 'low') {
      this.filterX = new OneEuroFilter1D(1.2, 0.02);
      this.filterY = new OneEuroFilter1D(1.2, 0.02);
    } else if (level === 'high') {
      this.filterX = new OneEuroFilter1D(0.3, 0.003);
      this.filterY = new OneEuroFilter1D(0.3, 0.003);
    } else {
      // Medium (default)
      this.filterX = new OneEuroFilter1D(0.6, 0.01);
      this.filterY = new OneEuroFilter1D(0.6, 0.01);
    }
  }

  public reset() {
    this.state = 'up';
    this.pendingStartTime = 0;
    this.lastCommittedPoint = null;
    this.currentPinchRatio = 0;
    this.filterX.reset();
    this.filterY.reset();
  }

  /**
   * Landmark check for index extended and other fingers folded.
   */
  public isPointingGesture(landmarks: NormalizedLandmark[], gestureName?: string): boolean {
    if (gestureName === 'Open_Palm' || gestureName === 'Closed_Fist') return false;
    if (gestureName === 'Pointing_Up') return true;

    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    const distW = (pt: NormalizedLandmark) => Math.hypot(pt.x - wrist.x, pt.y - wrist.y);

    const indexExtended = distW(indexTip) > distW(indexPip) * 1.08;
    const middleFolded = distW(middleTip) < distW(middlePip) * 1.15;
    const ringFolded = distW(ringTip) < distW(ringPip) * 1.15;
    const pinkyFolded = distW(pinkyTip) < distW(pinkyPip) * 1.15;

    return indexExtended && middleFolded && ringFolded && pinkyFolded;
  }

  /**
   * Process a landmark frame at timestamp.
   * mappedX and mappedY are optional pre-mapped arena pixel coordinates.
   */
  public update(
    landmarks: NormalizedLandmark[] | null,
    gestureName: string | undefined,
    arenaWidth: number,
    arenaHeight: number,
    timestamp: number,
    mappedX?: number,
    mappedY?: number
  ): {
    isPenDown: boolean;
    cursor: { x: number; y: number; isDown: boolean } | null;
    newPoint: DrawPoint | null;
    strokeEnded: boolean;
    pinchRatio: number;
    pinchThreshold: number;
  } {
    // 1. Hand lost: immediate Pen Up & end stroke
    if (!landmarks || landmarks.length !== 21) {
      const wasDown = this.state === 'down';
      this.reset();
      return {
        isPenDown: false,
        cursor: null,
        newPoint: null,
        strokeEnded: wasDown,
        pinchRatio: 0,
        pinchThreshold: this.PINCH_START,
      };
    }

    // 2. Compute palm size & pinch ratio
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palmSize = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const pinchRatio = pinchDist / Math.max(0.01, palmSize);
    this.currentPinchRatio = pinchRatio;

    // Use mapped coordinates if provided to align precisely with skeleton & pointer ring
    const rawX = mappedX !== undefined ? mappedX : (1 - indexTip.x) * arenaWidth;
    const rawY = mappedY !== undefined ? mappedY : indexTip.y * arenaHeight;

    // Apply One-Euro filter
    const smoothX = this.filterX.filter(rawX, timestamp);
    const smoothY = this.filterY.filter(rawY, timestamp);

    // 3. Determine if pen trigger condition is currently satisfied
    let isTriggerActive = false;
    if (gestureName === 'Open_Palm' || gestureName === 'Closed_Fist') {
      isTriggerActive = false; // Open palm or fist always releases pen
    } else if (this.penMode === 'pointing') {
      isTriggerActive = this.isPointingGesture(landmarks, gestureName);
    } else {
      // Pinch mode with hysteresis
      if (this.state === 'up') {
        isTriggerActive = pinchRatio < this.PINCH_START;
      } else {
        // While in pending_down or down, stay active until pinch releases past STOP threshold
        isTriggerActive = pinchRatio <= this.PINCH_STOP;
      }
    }

    let strokeEnded = false;
    let newPoint: DrawPoint | null = null;

    // 4. State transition with 100ms commit delay
    if (this.state === 'up') {
      if (isTriggerActive) {
        this.state = 'pending_down';
        this.pendingStartTime = timestamp;
      }
    } else if (this.state === 'pending_down') {
      if (!isTriggerActive) {
        this.state = 'up';
      } else if (timestamp - this.pendingStartTime >= this.COMMIT_DELAY_MS) {
        this.state = 'down';
        this.lastCommittedPoint = { x: smoothX, y: smoothY, time: timestamp };
        newPoint = { ...this.lastCommittedPoint };
      }
    } else if (this.state === 'down') {
      if (!isTriggerActive) {
        this.state = 'up';
        this.lastCommittedPoint = null;
        strokeEnded = true;
      } else {
        // Check teleport rejection (> 0.25 arena dimension)
        const maxJump = this.TELEPORT_FRACTION * Math.min(arenaWidth, arenaHeight);
        if (this.lastCommittedPoint) {
          const jumpDist = Math.hypot(smoothX - this.lastCommittedPoint.x, smoothY - this.lastCommittedPoint.y);
          if (jumpDist > maxJump) {
            strokeEnded = true;
            this.lastCommittedPoint = { x: smoothX, y: smoothY, time: timestamp };
            newPoint = { ...this.lastCommittedPoint };
          } else if (jumpDist >= this.DEADZONE_PX) {
            this.lastCommittedPoint = { x: smoothX, y: smoothY, time: timestamp };
            newPoint = { ...this.lastCommittedPoint };
          }
        } else {
          this.lastCommittedPoint = { x: smoothX, y: smoothY, time: timestamp };
          newPoint = { ...this.lastCommittedPoint };
        }
      }
    }

    return {
      isPenDown: this.state === 'down',
      cursor: { x: smoothX, y: smoothY, isDown: this.state === 'down' },
      newPoint,
      strokeEnded,
      pinchRatio,
      pinchThreshold: this.state === 'up' ? this.PINCH_START : this.PINCH_STOP,
    };
  }
}

/**
 * Draw a single stroke with Catmull-Rom / smooth quadratic curves and round caps.
 */
export function renderStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size;

  if (stroke.isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
  }

  const pts = stroke.points;
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Smooth quadratic curves through midpoints
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }

  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}
