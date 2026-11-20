import { describe, it, expect } from 'vitest';
import {
  mapFingertipCoordinates,
  PointerMapper,
  DEFAULT_CALIBRATION,
} from '../engine/pointerMapper';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

function createMockLandmarksWithFingertip(rawX: number, rawY: number): NormalizedLandmark[] {
  const lms: NormalizedLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    lms.push({ x: 0.5, y: 0.5, z: 0, visibility: 1 });
  }
  // landmark 8 is index fingertip
  lms[8] = { x: rawX, y: rawY, z: 0, visibility: 1 };
  // landmark 4 is thumb tip
  lms[4] = { x: 0.2, y: 0.2, z: 0, visibility: 1 };
  return lms;
}

describe('PointerMapper Coordinates & Calibration', () => {
  it('maps fingertip from active region (0.15 to 0.85) to full arena (0 to 1)', () => {
    const cal = { minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 };

    // Mirrored: physical hand on the left means rawX in mirrored frame is at minX
    const atLeft = mapFingertipCoordinates(0.2, 0.5, cal);
    expect(atLeft.x).toBeCloseTo(0.0, 2);

    const atRight = mapFingertipCoordinates(0.8, 0.5, cal);
    expect(atRight.x).toBeCloseTo(1.0, 2);

    const atCenter = mapFingertipCoordinates(0.5, 0.5, cal);
    expect(atCenter.x).toBeCloseTo(0.5, 2);

    const atTop = mapFingertipCoordinates(0.5, 0.2, cal);
    expect(atTop.y).toBeCloseTo(0.0, 2);

    const atBottom = mapFingertipCoordinates(0.5, 0.8, cal);
    expect(atBottom.y).toBeCloseTo(1.0, 2);
  });

  it('clamps coordinates beyond calibration bounds cleanly to 0 and 1', () => {
    const cal = { minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 };

    const beyondLeft = mapFingertipCoordinates(0.05, 0.5, cal);
    expect(beyondLeft.x).toBe(0);

    const beyondRight = mapFingertipCoordinates(0.95, 0.5, cal);
    expect(beyondRight.x).toBe(1);

    const beyondTop = mapFingertipCoordinates(0.5, 0.05, cal);
    expect(beyondTop.y).toBe(0);

    const beyondBottom = mapFingertipCoordinates(0.5, 0.95, cal);
    expect(beyondBottom.y).toBe(1);
  });

  it('PointerMapper process correctly identifies hand presence and visibility', () => {
    const mapper = new PointerMapper();

    // No hand
    const noHandRes = mapper.process(null);
    expect(noHandRes.isVisible).toBe(false);

    // With hand: raw index tip at x = 0.3 (mirrored rawX = 1 - 0.3 = 0.7)
    const hand = createMockLandmarksWithFingertip(0.3, 0.4);
    const handRes = mapper.process(hand);
    expect(handRes.isVisible).toBe(true);
    expect(handRes.x).toBeGreaterThan(0);
    expect(handRes.y).toBeGreaterThan(0);
  });

  it('resets calibration to defaults', () => {
    const mapper = new PointerMapper();
    mapper.setCalibration({ minX: 0.1, maxX: 0.9, minY: 0.1, maxY: 0.9 });
    expect(mapper.getCalibration().minX).toBe(0.1);

    mapper.resetCalibration();
    expect(mapper.getCalibration().minX).toBe(DEFAULT_CALIBRATION.minX);
    expect(mapper.getCalibration().maxX).toBe(DEFAULT_CALIBRATION.maxX);
  });
});
