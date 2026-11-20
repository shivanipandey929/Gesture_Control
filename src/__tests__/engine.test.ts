import { describe, it, expect, beforeEach } from 'vitest';
import { LandmarkSmoother } from '../engine/smoothing';
import { GestureFilter } from '../engine/gestureFilter';
import { SwipeDetector } from '../engine/swipeDetector';
import {
  normalizeLandmarks,
  calculatePoseDistance,
  CustomGestureKNN
} from '../engine/knnClassifier';
import { createRealistic21Landmarks } from './helpers/landmarkFixtures';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Helper to generate mock 21 landmarks
function createMockLandmarks(offset = 0): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    landmarks.push({
      x: 0.5 + i * 0.01 + offset,
      y: 0.5 + i * 0.01 + offset,
      z: 0.0 + offset,
      visibility: 1,
    });
  }
  return landmarks;
}

describe('1€ (One Euro) Smoothing Filter', () => {
  let smoother: LandmarkSmoother;

  beforeEach(() => {
    smoother = new LandmarkSmoother();
  });

  it('initializes and returns initial raw landmarks on first frame', () => {
    const raw = createMockLandmarks();
    const smoothed = smoother.smooth(raw, 1000);
    expect(smoothed).toHaveLength(21);
    expect(smoothed[0].x).toBeCloseTo(raw[0].x, 5);
    expect(smoothed[0].y).toBeCloseTo(raw[0].y, 5);
  });

  it('dampens sudden high-frequency jitter on subsequent frames', () => {
    const initial = createMockLandmarks(0);
    smoother.smooth(initial, 1000);

    // Sudden micro-jitter on frame 2 (16ms later)
    const jittered = createMockLandmarks(0.005);
    const smoothed = smoother.smooth(jittered, 1016);

    // The smoothed coordinate should be filtered closer to the previous state than raw jitter
    expect(smoothed[0].x).toBeLessThan(jittered[0].x);
    expect(smoothed[0].x).toBeGreaterThan(initial[0].x);
  });

  it('resets state on smoother.reset()', () => {
    const raw = createMockLandmarks();
    smoother.smooth(raw, 1000);
    smoother.reset();
    const newRaw = createMockLandmarks(0.2);
    const firstAfterReset = smoother.smooth(newRaw, 2000);
    expect(firstAfterReset[0].x).toBeCloseTo(newRaw[0].x, 5);
  });
});

describe('GestureFilter (Stability, Confidence & Cooldown)', () => {
  let filter: GestureFilter;

  beforeEach(() => {
    filter = new GestureFilter({
      confidenceThreshold: 0.70,
      stabilityDurationMs: 350,
      cooldownDurationMs: 600,
    });
  });

  it('ignores detections below the 0.70 confidence threshold', () => {
    const result = filter.process('Open_Palm', 0.65, 1000);
    expect(result.filteredGesture).toBe('None');
    expect(result.isTriggered).toBe(false);
    expect(result.stabilityProgress).toBe(0);
  });

  it('requires holding gesture for 350 ms before triggering', () => {
    // Start of candidate gesture
    const r1 = filter.process('Open_Palm', 0.90, 1000);
    expect(r1.filteredGesture).toBe('None');
    expect(r1.isTriggered).toBe(false);
    expect(r1.stabilityProgress).toBe(0);

    // At 200 ms (insufficient hold)
    const r2 = filter.process('Open_Palm', 0.90, 1200);
    expect(r2.filteredGesture).toBe('None');
    expect(r2.isTriggered).toBe(false);
    expect(r2.stabilityProgress).toBeCloseTo(200 / 350, 1);

    // At 360 ms (exceeds 350 ms threshold)
    const r3 = filter.process('Open_Palm', 0.90, 1360);
    expect(r3.filteredGesture).toBe('Open_Palm');
    expect(r3.isTriggered).toBe(true);
    expect(r3.stabilityProgress).toBe(1);
  });

  it('enforces a 600 ms cooldown preventing immediate repeat triggers', () => {
    // Trigger gesture at 1360 ms
    filter.process('Open_Palm', 0.90, 1000);
    filter.process('Open_Palm', 0.90, 1360);

    // Try triggering another gesture at 1600 ms (240 ms elapsed, cooldown active)
    const cooldownRes = filter.process('Closed_Fist', 0.95, 1600);
    expect(cooldownRes.inCooldown).toBe(true);
    expect(cooldownRes.isTriggered).toBe(false);

    // Advance past 600 ms cooldown (at 2000 ms, 640 ms elapsed)
    const readyRes = filter.process('Closed_Fist', 0.95, 2000);
    expect(readyRes.inCooldown).toBe(false);
  });
});

describe('SwipeDetector', () => {
  let detector: SwipeDetector;

  beforeEach(() => {
    detector = new SwipeDetector(0.5); // 0.5 velocity threshold
  });

  it('detects a rapid Swipe_Right in mirrored camera coordinate space (dx < 0)', () => {
    const t0 = 1000;
    // Mirrored camera: user moving hand to right decreases X in raw frame
    const p1 = createRealistic21Landmarks(0.7, 0.5, 'swipe');
    detector.update(p1, t0);

    const p2 = createRealistic21Landmarks(0.4, 0.5, 'swipe');
    detector.update(p2, t0 + 40);

    const p3 = createRealistic21Landmarks(0.1, 0.5, 'swipe');
    const res = detector.update(p3, t0 + 80);

    expect(res.swipe).toBe('Swipe_Right');
    expect(res.velocity.vx).toBeLessThan(0);
  });

  it('detects a rapid Swipe_Left in mirrored camera coordinate space (dx > 0)', () => {
    const t0 = 2000;
    const p1 = createRealistic21Landmarks(0.1, 0.5, 'swipe');
    detector.update(p1, t0);

    const p2 = createRealistic21Landmarks(0.4, 0.5, 'swipe');
    detector.update(p2, t0 + 40);

    const p3 = createRealistic21Landmarks(0.7, 0.5, 'swipe');
    const res = detector.update(p3, t0 + 80);

    expect(res.swipe).toBe('Swipe_Left');
    expect(res.velocity.vx).toBeGreaterThan(0);
  });
});

describe('KNN Gesture Classifier & Normalization', () => {
  it('normalizes landmarks to be translation-invariant (wrist at origin)', () => {
    const landmarks = createMockLandmarks(0.3);
    const normalized = normalizeLandmarks(landmarks);

    expect(normalized.landmarks).toHaveLength(21);
    // Wrist point 0 must be 0,0,0
    expect(normalized.landmarks[0].x).toBeCloseTo(0, 5);
    expect(normalized.landmarks[0].y).toBeCloseTo(0, 5);
    expect(normalized.landmarks[0].z).toBeCloseTo(0, 5);
  });

  it('normalizes landmarks to be scale-invariant', () => {
    const base = createMockLandmarks(0);
    // Double distance of all points from origin
    const scaled: NormalizedLandmark[] = base.map((p) => ({
      x: p.x * 2,
      y: p.y * 2,
      z: (p.z ?? 0) * 2,
      visibility: 1,
    }));

    const normBase = normalizeLandmarks(base);
    const normScaled = normalizeLandmarks(scaled);

    const distance = calculatePoseDistance(normBase, normScaled);
    expect(distance).toBeLessThan(0.01);
  });

  it('correctly classifies a trained gesture via KNN nearest-neighbor matching', () => {
    const knn = new CustomGestureKNN();
    const trainingPose = createMockLandmarks(0);

    knn.addInMemoryGesture('Custom_Wave', 'TRIGGER_WAVE', [trainingPose]);

    // Classify an identical pose
    const match = knn.classify(trainingPose);
    expect(match).not.toBeNull();
    expect(match?.gestureName).toBe('Custom_Wave');
    expect(match?.action).toBe('TRIGGER_WAVE');
    expect(match?.confidence).toBeGreaterThan(0.9);
  });
});
