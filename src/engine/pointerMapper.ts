import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { db } from '../db/db';
import { mapCameraPointToArena } from '../utils/coordinateMapping';

export interface PointerCalibration {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_CALIBRATION: PointerCalibration = {
  minX: 0.15, // center 70% width: 0.15 to 0.85
  maxX: 0.85,
  minY: 0.20, // center 60% height: 0.20 to 0.80
  maxY: 0.80,
};

export function mapFingertipCoordinates(
  rawMirroredX: number,
  rawY: number,
  cal: PointerCalibration = DEFAULT_CALIBRATION
): { x: number; y: number } {
  const rangeX = Math.max(0.01, cal.maxX - cal.minX);
  const rangeY = Math.max(0.01, cal.maxY - cal.minY);

  const normX = Math.max(0, Math.min(1, (rawMirroredX - cal.minX) / rangeX));
  const normY = Math.max(0, Math.min(1, (rawY - cal.minY) / rangeY));

  return { x: normX, y: normY };
}

export class PointerMapper {
  private calibration: PointerCalibration = { ...DEFAULT_CALIBRATION };
  private smoothedX: number = 0.5;
  private smoothedY: number = 0.5;
  private isInitialized: boolean = false;
  private smoothingAlpha: number = 0.45;

  constructor(customCal?: Partial<PointerCalibration>) {
    if (customCal) {
      this.calibration = { ...DEFAULT_CALIBRATION, ...customCal };
    } else {
      this.loadCalibration();
    }
  }

  public getCalibration(): PointerCalibration {
    return { ...this.calibration };
  }

  public setCalibration(cal: PointerCalibration) {
    this.calibration = { ...cal };
    this.saveCalibration();
  }

  public resetCalibration() {
    this.calibration = { ...DEFAULT_CALIBRATION };
    this.saveCalibration();
  }

  public async loadCalibration(): Promise<PointerCalibration> {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('aerotouch_pointer_calibration');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.minX === 'number') {
            this.calibration = parsed;
          }
        }
      } catch { }
    }

    try {
      const record = await db.settings.get('pointer_calibration');
      if (record && record.value && typeof (record.value as PointerCalibration).minX === 'number') {
        this.calibration = record.value as PointerCalibration;
      }
    } catch { }

    return this.calibration;
  }

  public async saveCalibration() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aerotouch_pointer_calibration', JSON.stringify(this.calibration));
      } catch { }
    }

    try {
      await db.settings.put({
        key: 'pointer_calibration',
        value: this.calibration,
        synced: false,
        updatedAt: Date.now(),
      });
    } catch { }
  }

  public process(
    landmarks: NormalizedLandmark[] | null | undefined,
    boxDimensions?: {
      boxWidth: number;
      boxHeight: number;
      videoWidth: number;
      videoHeight: number;
      objectFit?: 'cover' | 'contain';
    }
  ): {
    x: number; // percentage 0..100
    y: number; // percentage 0..100
    normX: number; // 0..1
    normY: number; // 0..1
    pixelX?: number;
    pixelY?: number;
    isVisible: boolean;
    isPinching: boolean;
  } {
    if (!landmarks || landmarks.length < 21) {
      return {
        x: this.smoothedX * 100,
        y: this.smoothedY * 100,
        normX: this.smoothedX,
        normY: this.smoothedY,
        pixelX: 0,
        pixelY: 0,
        isVisible: false,
        isPinching: false,
      };
    }

    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // Detect pinch between index and thumb
    const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const isPinching = pinchDist < 0.085;

    // Direct object-fit arena mapping when box dimensions are provided
    if (boxDimensions && boxDimensions.boxWidth > 0 && boxDimensions.boxHeight > 0) {
      const pt = mapCameraPointToArena(indexTip.x, indexTip.y, {
        boxWidth: boxDimensions.boxWidth,
        boxHeight: boxDimensions.boxHeight,
        videoWidth: boxDimensions.videoWidth,
        videoHeight: boxDimensions.videoHeight,
        objectFit: boxDimensions.objectFit || 'cover',
        mirrored: true,
      });

      const normX = pt.percentX / 100;
      const normY = pt.percentY / 100;

      if (!this.isInitialized) {
        this.smoothedX = normX;
        this.smoothedY = normY;
        this.isInitialized = true;
      } else {
        this.smoothedX += (normX - this.smoothedX) * this.smoothingAlpha;
        this.smoothedY += (normY - this.smoothedY) * this.smoothingAlpha;
      }

      return {
        x: this.smoothedX * 100,
        y: this.smoothedY * 100,
        normX: this.smoothedX,
        normY: this.smoothedY,
        pixelX: this.smoothedX * boxDimensions.boxWidth,
        pixelY: this.smoothedY * boxDimensions.boxHeight,
        isVisible: true,
        isPinching,
      };
    }

    // Mirrored horizontally so hand moving to physical right moves pointer to the right
    const rawMirroredX = 1 - indexTip.x;
    const rawY = indexTip.y;

    const { x: mappedX, y: mappedY } = mapFingertipCoordinates(rawMirroredX, rawY, this.calibration);

    if (!this.isInitialized) {
      this.smoothedX = mappedX;
      this.smoothedY = mappedY;
      this.isInitialized = true;
    } else {
      this.smoothedX += (mappedX - this.smoothedX) * this.smoothingAlpha;
      this.smoothedY += (mappedY - this.smoothedY) * this.smoothingAlpha;
    }

    return {
      x: this.smoothedX * 100,
      y: this.smoothedY * 100,
      normX: this.smoothedX,
      normY: this.smoothedY,
      isVisible: true,
      isPinching,
    };
  }

  public reset() {
    this.isInitialized = false;
    this.smoothedX = 0.5;
    this.smoothedY = 0.5;
  }
}

export const sharedPointerMapper = new PointerMapper();
