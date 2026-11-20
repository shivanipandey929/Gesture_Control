import { describe, it, expect } from 'vitest';
import { AirDrawStateMachine } from '../pages/practice/AirDrawEngine';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

function createMockLandmarks(pinchRatio: number, x: number = 0.5, y: number = 0.5): NormalizedLandmark[] {
  // palmSize = distance between lm0 and lm9
  // let lm0 = (0.5, 0.6), lm9 = (0.5, 0.4) => palmSize = 0.2
  const palmSize = 0.2;
  const pinchDist = pinchRatio * palmSize;

  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({ x, y, z: 0, visibility: 1 }));
  landmarks[0] = { x, y: y + 0.1, z: 0, visibility: 1 }; // Wrist
  landmarks[9] = { x, y: y - 0.1, z: 0, visibility: 1 }; // Middle MCP

  // Index tip at (x, y)
  landmarks[8] = { x, y, z: 0, visibility: 1 };
  // Thumb tip at distance pinchDist from index tip
  landmarks[4] = { x: x + pinchDist, y, z: 0, visibility: 1 };

  return landmarks;
}

describe('AirDrawStateMachine', () => {
  const ARENA_W = 1000;
  const ARENA_H = 600;

  describe('150ms Commit Delay', () => {
    it('does not trigger pen down if pinch duration is less than 150ms (micro-flicker)', () => {
      const sm = new AirDrawStateMachine('pinch');
      let t = 1000;
      const step = 33; // ~30 FPS

      // Pinch begins (pinch ratio 0.2 < 0.30)
      const pinchLm = createMockLandmarks(0.2);

      // Frame 1: t = 1000ms -> pending_down
      let res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);
      expect(sm.state).toBe('pending_down');

      // Frame 2: t = 1033ms (< 150ms)
      t += step;
      res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);

      // Frame 3: t = 1066ms (< 150ms)
      t += step;
      res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);

      // Pinch released (ratio 0.5 > 0.42) before 150ms
      const openLm = createMockLandmarks(0.5);
      t += step;
      res = sm.update(openLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);
      expect(sm.state).toBe('up');
      expect(res.newPoint).toBeNull();
    });

    it('triggers pen down once pinch is held >= 150ms at 30 FPS', () => {
      const sm = new AirDrawStateMachine('pinch');
      let t = 1000;
      const step = 33; // 30 FPS
      const pinchLm = createMockLandmarks(0.2);

      let res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);

      // Advance by 165ms (5 frames)
      for (let i = 0; i < 5; i++) {
        t += step;
        res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      }

      expect(res.isPenDown).toBe(true);
      expect(sm.state).toBe('down');
      expect(res.newPoint).not.toBeNull();
    });

    it('triggers pen down once pinch is held >= 150ms at 12 FPS', () => {
      const sm = new AirDrawStateMachine('pinch');
      let t = 1000;
      const step = 83; // 12 FPS (~83ms/frame)
      const pinchLm = createMockLandmarks(0.2);

      // Frame 1: t = 1000ms
      let res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);

      // Frame 2: t = 1083ms (83ms elapsed < 150ms)
      t += step;
      res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);

      // Frame 3: t = 1166ms (166ms elapsed >= 150ms)
      t += step;
      res = sm.update(pinchLm, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);
      expect(sm.state).toBe('down');
      expect(res.newPoint).not.toBeNull();
    });
  });

  describe('Pinch Hysteresis', () => {
    it('maintains pen down between 0.30 and 0.42 and stops only when exceeding 0.42', () => {
      const sm = new AirDrawStateMachine('pinch');
      let t = 1000;

      // Start pinch (< 0.30)
      sm.update(createMockLandmarks(0.25), undefined, ARENA_W, ARENA_H, t);
      t += 160;
      let res = sm.update(createMockLandmarks(0.25), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);

      // Slight finger opening to 0.35 (between 0.30 and 0.42)
      t += 33;
      res = sm.update(createMockLandmarks(0.35), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true); // Should stay down due to hysteresis!

      // Finger opens to 0.40
      t += 33;
      res = sm.update(createMockLandmarks(0.40), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);

      // Finger opens past stop threshold (> 0.42)
      t += 33;
      res = sm.update(createMockLandmarks(0.45), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);
      expect(res.strokeEnded).toBe(true);
    });
  });

  describe('Lost Hand & Stroke Disconnection', () => {
    it('immediately ends stroke when hand is lost and never connects to next stroke', () => {
      const sm = new AirDrawStateMachine('pinch');
      let t = 1000;

      // Start drawing at (0.2, 0.2)
      sm.update(createMockLandmarks(0.2, 0.2, 0.2), undefined, ARENA_W, ARENA_H, t);
      t += 160;
      let res = sm.update(createMockLandmarks(0.2, 0.2, 0.2), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);

      // Draw second point
      t += 33;
      res = sm.update(createMockLandmarks(0.2, 0.25, 0.25), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);

      // Hand is lost (null landmarks)
      t += 33;
      res = sm.update(null, undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false);
      expect(res.strokeEnded).toBe(true);
      expect(sm.state).toBe('up');

      // Hand reappears at far position (0.8, 0.8) and pinches
      t += 500;
      res = sm.update(createMockLandmarks(0.2, 0.8, 0.8), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(false); // Must wait commit delay
      expect(res.strokeEnded).toBe(false);

      t += 160;
      res = sm.update(createMockLandmarks(0.2, 0.8, 0.8), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);
      expect(res.newPoint).not.toBeNull();
      // Verify point is at new position and not connected
      expect(res.newPoint?.x).toBeGreaterThan(0.5);
    });
  });

  describe('Teleport Rejection', () => {
    it('splits strokes when jump exceeds 25% of arena dimension', () => {
      const sm = new AirDrawStateMachine('pinch', 'off');
      let t = 1000;

      // Start stroke at x = 0.2
      sm.update(createMockLandmarks(0.2, 0.2, 0.5), undefined, ARENA_W, ARENA_H, t);
      t += 160;
      let res = sm.update(createMockLandmarks(0.2, 0.2, 0.5), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);

      // Next frame: sudden jump from x = 0.2 to x = 0.7 (> 25% of 600px = 150px jump)
      // (1 - 0.2) * 1000 = 800, (1 - 0.7) * 1000 = 300 => jump = 500px > 150px!
      t += 33;
      res = sm.update(createMockLandmarks(0.2, 0.7, 0.5), undefined, ARENA_W, ARENA_H, t);
      expect(res.isPenDown).toBe(true);
      expect(res.strokeEnded).toBe(true); // Should signal stroke separation
      expect(res.newPoint).not.toBeNull();
    });
  });
});
