import { describe, it, expect, beforeEach } from 'vitest';
import { SwipeDetector } from '../engine/swipeDetector';
import { GestureFilter } from '../engine/gestureFilter';
import { createRealistic21Landmarks } from './helpers/landmarkFixtures';

function createLandmarks(palmX: number, palmY: number, fingersExtended = 5) {
  return createRealistic21Landmarks(palmX, palmY, 'swipe', fingersExtended);
}

describe('SwipeDetector & GestureFilter Reliability', () => {
  let swipeDetector: SwipeDetector;
  let gestureFilter: GestureFilter;

  beforeEach(() => {
    swipeDetector = new SwipeDetector('relaxed');
    gestureFilter = new GestureFilter('relaxed');
  });

  it('Synthetic right swipe at 15 FPS fires exactly once', () => {
    // 15 FPS: 66.6ms per frame
    // Total duration: 300ms (5 frames)
    // Mirrored: moving physical hand to the right means rawX goes from 0.70 to 0.40
    // so mirroredX = 1 - rawX goes from 0.30 to 0.60 (dx = +0.30, travel = 0.30 >= 0.20)
    // speed = 0.30 / 0.266s = 1.12 frame widths/s >= 0.45
    const frameInterval = 66.6;
    let firedCount = 0;
    let firedDirection: string | null = null;

    const startX = 0.70;
    const endX = 0.40;
    const totalFrames = 5;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentX = startX + (endX - startX) * (i / (totalFrames - 1));
      const lms = createLandmarks(currentX, 0.5, 4);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
        firedDirection = res.swipe;
      }
    }

    expect(firedCount).toBe(1);
    expect(firedDirection).toBe('Swipe_Right');
  });

  it('Synthetic left swipe at 30 FPS fires exactly once', () => {
    // 30 FPS: 33.3ms per frame
    // Moving physical hand left: rawX goes from 0.30 to 0.60
    // mirroredX goes from 0.70 to 0.40 (dx = -0.30)
    const frameInterval = 33.3;
    let firedCount = 0;
    let firedDirection: string | null = null;

    const startX = 0.30;
    const endX = 0.60;
    const totalFrames = 8;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentX = startX + (endX - startX) * (i / (totalFrames - 1));
      const lms = createLandmarks(currentX, 0.5, 4);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
        firedDirection = res.swipe;
      }
    }

    expect(firedCount).toBe(1);
    expect(firedDirection).toBe('Swipe_Left');
  });

  it('Slow drift does NOT fire swipe', () => {
    // Moves across 1000ms: speed is only 0.20 / 1.0s = 0.20 frame widths/s (< 0.45)
    let firedCount = 0;
    const totalFrames = 15;
    const frameInterval = 66.6; // 15 FPS

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentX = 0.70 - 0.20 * (i / (totalFrames - 1));
      const lms = createLandmarks(currentX, 0.5, 4);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
      }
    }

    expect(firedCount).toBe(0);
  });

  it('Vertical drift does NOT fire swipe (horizontal travel < 2 * vertical travel)', () => {
    // Moves equally horizontal and vertical
    let firedCount = 0;
    const totalFrames = 6;
    const frameInterval = 50;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentX = 0.70 - 0.25 * (i / (totalFrames - 1));
      const currentY = 0.30 + 0.25 * (i / (totalFrames - 1));
      const lms = createLandmarks(currentX, currentY, 4);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
      }
    }

    expect(firedCount).toBe(0);
  });

  it('Swipe with fewer than 3 fingers extended does NOT fire', () => {
    let firedCount = 0;
    const totalFrames = 5;
    const frameInterval = 66.6;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentX = 0.70 - 0.30 * (i / (totalFrames - 1));
      // Only 2 fingers extended
      const lms = createLandmarks(currentX, 0.5, 2);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
      }
    }

    expect(firedCount).toBe(0);
  });

  it('Open_Palm with score 0.58 fires after 250 ms', () => {
    // At t=0: candidate initialized, should not fire yet
    let res = gestureFilter.process('Open_Palm', 0.58, 0);
    expect(res.isTriggered).toBe(false);

    // At t=150ms: 150ms held, should not fire yet
    res = gestureFilter.process('Open_Palm', 0.58, 150);
    expect(res.isTriggered).toBe(false);
    expect(res.stabilityProgress).toBeCloseTo(150 / 250, 1);

    // At t=260ms: >= 250ms held, should trigger!
    res = gestureFilter.process('Open_Palm', 0.58, 260);
    expect(res.isTriggered).toBe(true);
    expect(res.filteredGesture).toBe('Open_Palm');
    expect(res.stabilityProgress).toBe(1.0);
  });

  it('Closed_Fist with score 0.58 does NOT fire on relaxed (requires 0.60)', () => {
    // At t=0
    let res = gestureFilter.process('Closed_Fist', 0.58, 0);
    expect(res.isTriggered).toBe(false);

    // At t=300ms
    res = gestureFilter.process('Closed_Fist', 0.58, 300);
    expect(res.isTriggered).toBe(false);
    expect(gestureFilter.telemetry.whyNotFired).toContain('Confidence too low');
  });

  it('Closed_Fist with score 0.65 fires after 250 ms on relaxed', () => {
    let res = gestureFilter.process('Closed_Fist', 0.65, 0);
    expect(res.isTriggered).toBe(false);

    res = gestureFilter.process('Closed_Fist', 0.65, 260);
    expect(res.isTriggered).toBe(true);
    expect(res.filteredGesture).toBe('Closed_Fist');
  });

  it('Synthetic vertical swipe up at 30 FPS fires Swipe_Up', () => {
    // Y goes from 0.70 to 0.40 (upwards, dy = -0.30)
    const frameInterval = 33.3;
    let firedCount = 0;
    let firedDirection: string | null = null;

    const startY = 0.70;
    const endY = 0.40;
    const totalFrames = 8;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentY = startY + (endY - startY) * (i / (totalFrames - 1));
      const lms = createLandmarks(0.5, currentY, 5);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
        firedDirection = res.swipe;
      }
    }

    expect(firedCount).toBe(1);
    expect(firedDirection).toBe('Swipe_Up');
  });

  it('Synthetic vertical swipe down at 30 FPS fires Swipe_Down', () => {
    // Y goes from 0.35 to 0.65 (downwards, dy = +0.30)
    const frameInterval = 33.3;
    let firedCount = 0;
    let firedDirection: string | null = null;

    const startY = 0.35;
    const endY = 0.65;
    const totalFrames = 8;

    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameInterval;
      const currentY = startY + (endY - startY) * (i / (totalFrames - 1));
      const lms = createLandmarks(0.5, currentY, 5);

      const res = swipeDetector.update(lms, t);
      if (res.swipe) {
        firedCount++;
        firedDirection = res.swipe;
      }
    }

    expect(firedCount).toBe(1);
    expect(firedDirection).toBe('Swipe_Down');
  });

  describe('Realistic 21-Landmark Fixture Geometry', () => {
    it('accurately counts 5 extended fingers for open_palm and swipe', () => {
      const openPalm = createRealistic21Landmarks(0.5, 0.5, 'open_palm');
      expect(SwipeDetector.countExtendedFingers(openPalm)).toBe(5);

      const swipeHand = createRealistic21Landmarks(0.5, 0.5, 'swipe');
      expect(SwipeDetector.countExtendedFingers(swipeHand)).toBe(5);
    });

    it('accurately counts 0 extended fingers for closed_fist', () => {
      const fist = createRealistic21Landmarks(0.5, 0.5, 'closed_fist');
      expect(SwipeDetector.countExtendedFingers(fist)).toBe(0);
    });

    it('accurately counts 1 extended finger for pointing_up', () => {
      const pointing = createRealistic21Landmarks(0.5, 0.5, 'pointing_up');
      expect(SwipeDetector.countExtendedFingers(pointing)).toBe(1);
    });

    it('accurately calculates mirrored palm center without test hooks', () => {
      const center = SwipeDetector.calculatePalmCenter(createRealistic21Landmarks(0.6, 0.4, 'open_palm'));
      // Mirrored X = 1 - rawX = 1 - 0.6 = 0.4
      expect(center.x).toBeCloseTo(0.4, 2);
      expect(center.y).toBeCloseTo(0.4, 2);
    });
  });
});
