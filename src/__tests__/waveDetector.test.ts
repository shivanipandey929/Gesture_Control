import { describe, it, expect, beforeEach } from 'vitest';
import { WaveDetector } from '../engine/waveDetector';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

function createHandLandmarks(x: number, y: number, openFingers: number = 5): NormalizedLandmark[] {
  const lms: NormalizedLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    lms.push({ x, y, z: 0, visibility: 1 });
  }

  // Set wrist
  lms[0] = { x, y: y + 0.15, z: 0, visibility: 1 };
  // Palm landmarks
  lms[5] = { x, y: y + 0.05, z: 0, visibility: 1 };
  lms[9] = { x, y: y + 0.05, z: 0, visibility: 1 };
  lms[13] = { x, y: y + 0.05, z: 0, visibility: 1 };
  lms[17] = { x, y: y + 0.05, z: 0, visibility: 1 };

  // Set extended fingers: tip farther from wrist than PIP
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerPips = [2, 6, 10, 14, 18];

  for (let f = 0; f < 5; f++) {
    const isExtended = f < openFingers;
    const tip = fingerTips[f];
    const pip = fingerPips[f];
    if (isExtended) {
      lms[pip] = { x, y: y + 0.06, z: 0, visibility: 1 };
      lms[tip] = { x, y: y - 0.05, z: 0, visibility: 1 };
    } else {
      // curled finger
      lms[pip] = { x, y: y + 0.06, z: 0, visibility: 1 };
      lms[tip] = { x, y: y + 0.08, z: 0, visibility: 1 };
    }
  }

  return lms;
}

describe('WaveDetector Unit Tests', () => {
  let waveDetector: WaveDetector;

  beforeEach(() => {
    waveDetector = new WaveDetector();
  });

  it('detects a wave after 3 distinct horizontal direction reversals within 1.4s', () => {
    // 3 reversals:
    // Swing 1: move right from 0.40 to 0.55 (width 0.15 >= 0.06)
    // Swing 2: move left from 0.55 to 0.42 (width 0.13 >= 0.06) - Reversal 1
    // Swing 3: move right from 0.42 to 0.56 (width 0.14 >= 0.06) - Reversal 2
    // Swing 4: move left from 0.56 to 0.43 (width 0.13 >= 0.06) - Reversal 3 -> Trigger!

    let waveFired = false;
    let t = 1000;

    // Swing 1: move right (mirrored rawX goes 0.60 -> 0.45, so mirrored palm 1-rawX goes 0.40 -> 0.55)
    for (let x = 0.60; x >= 0.45; x -= 0.03) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 50;
    }

    // Swing 2: move left (rawX goes 0.45 -> 0.58)
    for (let x = 0.45; x <= 0.58; x += 0.03) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 50;
    }

    // Swing 3: move right (rawX goes 0.58 -> 0.44)
    for (let x = 0.58; x >= 0.44; x -= 0.03) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 50;
    }

    // Swing 4: move left (rawX goes 0.44 -> 0.57)
    for (let x = 0.44; x <= 0.57; x += 0.03) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 50;
    }

    expect(waveFired).toBe(true);
  });

  it('a single swipe in one direction does NOT trigger a wave', () => {
    let waveFired = false;
    let t = 1000;

    // Hand moves monotonically in one direction
    for (let x = 0.70; x >= 0.30; x -= 0.04) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 40;
    }

    expect(waveFired).toBe(false);
    expect(waveDetector.telemetry.reversalsCount).toBeLessThan(3);
  });

  it('slow drift does NOT trigger a wave (swings too small or too slow)', () => {
    let waveFired = false;
    let t = 1000;

    // Small jittery movements (< 0.06 frame width)
    const positions = [0.50, 0.52, 0.49, 0.51, 0.48, 0.52, 0.50];
    for (const x of positions) {
      const res = waveDetector.update(createHandLandmarks(x, 0.5, 5), t);
      if (res.isWave) waveFired = true;
      t += 200;
    }

    expect(waveFired).toBe(false);
  });
});
