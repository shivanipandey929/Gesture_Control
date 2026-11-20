import { describe, it, expect } from 'vitest';
import {
  clampVolume,
  stepVolume,
  canRepeatVolumeStep,
  pinchYToVolume,
  distanceToVolume,
  VolumeSmoother,
  isPinch,
  calculateTwoFingerVolume,
  OneEuroFilter,
  TwoFingerVolumeTracker,
} from '../utils/volumeMapping';
import { createRealistic21Landmarks } from './helpers/landmarkFixtures';

describe('Volume Control & Hand Mapping', () => {
  describe('Clamping & Step Logic', () => {
    it('clamps volume values strictly between 0 and 100', () => {
      expect(clampVolume(-15)).toBe(0);
      expect(clampVolume(115)).toBe(100);
      expect(clampVolume(54.7)).toBe(55);
      expect(clampVolume(0)).toBe(0);
      expect(clampVolume(100)).toBe(100);
    });

    it('steps volume by +/-10 with clamping at limits', () => {
      expect(stepVolume(50, 10)).toBe(60);
      expect(stepVolume(50, -10)).toBe(40);
      expect(stepVolume(95, 10)).toBe(100);
      expect(stepVolume(5, -10)).toBe(0);
    });

    it('enforces repeat rate throttling of 400ms for continuous hold', () => {
      const now = 1000;
      expect(canRepeatVolumeStep(now, now + 200, 400)).toBe(false);
      expect(canRepeatVolumeStep(now, now + 399, 400)).toBe(false);
      expect(canRepeatVolumeStep(now, now + 400, 400)).toBe(true);
      expect(canRepeatVolumeStep(now, now + 600, 400)).toBe(true);
    });
  });

  describe('Vertical Pinch Y to Volume Dial', () => {
    it('maps vertical position smoothly to volume (top=100%, bottom=0%)', () => {
      // Y=0.20 should be 100% volume
      expect(pinchYToVolume(0.20, 0.20, 0.80)).toBe(100);
      // Y=0.80 should be 0% volume
      expect(pinchYToVolume(0.80, 0.20, 0.80)).toBe(0);
      // Y=0.50 (midpoint) should be 50% volume
      expect(pinchYToVolume(0.50, 0.20, 0.80)).toBe(50);
      // Above top boundary is clamped to 100%
      expect(pinchYToVolume(0.10, 0.20, 0.80)).toBe(100);
      // Below bottom boundary is clamped to 0%
      expect(pinchYToVolume(0.95, 0.20, 0.80)).toBe(0);
    });
  });

  describe('Fingertip Distance to Volume (Alternative Mode)', () => {
    it('maps small gap to quiet (0%) and wide gap to loud (100%)', () => {
      // ratio <= 0.15 is 0%
      expect(distanceToVolume(0.10, 0.15, 0.65)).toBe(0);
      expect(distanceToVolume(0.15, 0.15, 0.65)).toBe(0);
      // ratio >= 0.65 is 100%
      expect(distanceToVolume(0.65, 0.15, 0.65)).toBe(100);
      expect(distanceToVolume(0.80, 0.15, 0.65)).toBe(100);
      // midpoint 0.40 is 50%
      expect(distanceToVolume(0.40, 0.15, 0.65)).toBe(50);
    });
  });

  describe('Volume Smoother', () => {
    it('smooths rapid volume adjustments without overshoot', () => {
      const smoother = new VolumeSmoother(0.5);
      smoother.reset(0);
      const step1 = smoother.filter(100);
      expect(step1).toBe(50);
      const step2 = smoother.filter(100);
      expect(step2).toBe(75);
      const step3 = smoother.filter(100);
      expect(step3).toBe(88);
    });
  });

  describe('Pinch Detection', () => {
    it('identifies pinch when thumb and index tip are close (<0.30 span)', () => {
      // Create closed fist landmarks where tips are close
      const fist = createRealistic21Landmarks(0.5, 0.5, 'closed_fist');
      expect(isPinch(fist, 0.30)).toBe(true);
      // For open palm, tips are far apart
      const palm = createRealistic21Landmarks(0.5, 0.5, 'open_palm');
      expect(isPinch(palm, 0.30)).toBe(false);
    });
  });

  describe('Two-Finger Relative Volume & One-Euro Filter (Requirement 4)', () => {
    it('calculates relative two-finger volume: clamp(anchorVolume + (anchorY - currentY) * 1.6, 0, 1)', () => {
      const anchorVol = 0.5;
      const anchorY = 0.5;

      // Moving fingertips UP by 0.1 (currentY = 0.40):
      // 0.5 + (0.5 - 0.4) * 1.6 = 0.5 + 0.16 = 0.66
      expect(calculateTwoFingerVolume(anchorVol, anchorY, 0.40, 1.6)).toBeCloseTo(0.66, 2);

      // Moving fingertips DOWN by 0.2 (currentY = 0.70):
      // 0.5 + (0.5 - 0.7) * 1.6 = 0.5 - 0.32 = 0.18
      expect(calculateTwoFingerVolume(anchorVol, anchorY, 0.70, 1.6)).toBeCloseTo(0.18, 2);

      // Extreme UP is clamped to 1.0
      expect(calculateTwoFingerVolume(anchorVol, anchorY, 0.10, 1.6)).toBe(1.0);

      // Extreme DOWN is clamped to 0.0
      expect(calculateTwoFingerVolume(anchorVol, anchorY, 0.90, 1.6)).toBe(0.0);
    });

    it('One-Euro filter filters noisy vertical input smoothly', () => {
      const filter = new OneEuroFilter(1.0, 0.01);
      const t0 = 1000;
      const f1 = filter.filter(0.5, t0);
      expect(f1).toBe(0.5);

      // Rapid jitter jump
      const f2 = filter.filter(0.6, t0 + 16);
      expect(f2).toBeGreaterThan(0.5);
      expect(f2).toBeLessThan(0.6);
    });

    it('TwoFingerVolumeTracker enters volume mode after 300ms hold and leaves after 450ms lost', () => {
      let savedVolume = 0;
      const tracker = new TwoFingerVolumeTracker(0.6, {
        onModeExit: (vol) => {
          savedVolume = vol;
        },
      });

      const t0 = 1000;
      const mockLms = createRealistic21Landmarks(0.5, 0.5, 'open_palm');

      // Frame 1: V sign at t0 -> not active yet
      let state = tracker.process(mockLms, 'Victory', t0);
      expect(state.isActive).toBe(false);

      // Frame 2: V sign held for 250ms -> still not active (<300ms)
      state = tracker.process(mockLms, 'Victory', t0 + 250);
      expect(state.isActive).toBe(false);

      // Frame 3: V sign held for 350ms -> ACTIVE!
      state = tracker.process(mockLms, 'Victory', t0 + 350);
      expect(state.isActive).toBe(true);
      expect(state.caption).toBe('Volume 60%');

      // Move fingertips UP by 0.08 (Y decreases towards screen top)
      mockLms[8].y -= 0.08;
      mockLms[12].y -= 0.08;
      state = tracker.process(mockLms, 'Victory', t0 + 400);
      expect(state.volume).toBeGreaterThan(0.6);

      // V sign lost at t0 + 500ms
      state = tracker.process(mockLms, 'Open_Palm', t0 + 500);
      expect(state.isActive).toBe(true); // debounce grace period

      // V sign lost for 300ms -> still active (<450ms)
      state = tracker.process(mockLms, 'Open_Palm', t0 + 800);
      expect(state.isActive).toBe(true);

      // V sign lost for 500ms -> EXITS mode and fires onModeExit!
      state = tracker.process(mockLms, 'Open_Palm', t0 + 1000);
      expect(state.isActive).toBe(false);
      expect(savedVolume).toBeGreaterThan(0);
    });
  });
});
