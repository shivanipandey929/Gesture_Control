import { describe, it, expect } from 'vitest';
import { mapCameraPointToArena } from '../utils/coordinateMapping';

describe('Coordinate Mapping - Camera to Arena Object-Fit Math', () => {
  // Test case requested in prompt: 640x480 video in a 720x478 box
  describe('640x480 video in 720x478 box (cover)', () => {
    const params = {
      boxWidth: 720,
      boxHeight: 478,
      videoWidth: 640,
      videoHeight: 480,
      objectFit: 'cover' as const,
      mirrored: true,
    };

    it('computes scale and offsets correctly', () => {
      // W/vw = 720/640 = 1.125
      // H/vh = 478/480 = 0.9958333...
      // s = max(1.125, 0.9958333...) = 1.125
      // ox = (720 - 640 * 1.125) / 2 = 0
      // oy = (478 - 480 * 1.125) / 2 = (478 - 540) / 2 = -31
      const mapped = mapCameraPointToArena(0.5, 0.5, params);
      expect(mapped.scale).toBeCloseTo(1.125, 5);
      expect(mapped.offsetX).toBeCloseTo(0, 5);
      expect(mapped.offsetY).toBeCloseTo(-31, 5);
    });

    it('maps center landmark (0.5, 0.5) to the exact center of the arena', () => {
      const mapped = mapCameraPointToArena(0.5, 0.5, params);
      // Center x = 0 + (1 - 0.5) * 640 * 1.125 = 360 (720 / 2 = 360)
      // Center y = -31 + 0.5 * 480 * 1.125 = -31 + 270 = 239 (478 / 2 = 239)
      expect(mapped.x).toBeCloseTo(360, 5);
      expect(mapped.y).toBeCloseTo(239, 5);
      expect(mapped.percentX).toBeCloseTo(50, 4);
      expect(mapped.percentY).toBeCloseTo(50, 4);
    });

    it('handles mirrored horizontal axis for left and right edges', () => {
      // Right in camera frame (lmX = 1) -> Left in mirrored arena (camX = 0)
      const mappedRightCam = mapCameraPointToArena(1.0, 0.5, params);
      expect(mappedRightCam.x).toBeCloseTo(0, 5);

      // Left in camera frame (lmX = 0) -> Right in mirrored arena (camX = 1)
      const mappedLeftCam = mapCameraPointToArena(0.0, 0.5, params);
      expect(mappedLeftCam.x).toBeCloseTo(720, 5);
    });

    it('handles non-mirrored mapping when mirrored is false', () => {
      const nonMirroredParams = { ...params, mirrored: false };
      const mappedLeft = mapCameraPointToArena(0.0, 0.5, nonMirroredParams);
      expect(mappedLeft.x).toBeCloseTo(0, 5);

      const mappedRight = mapCameraPointToArena(1.0, 0.5, nonMirroredParams);
      expect(mappedRight.x).toBeCloseTo(720, 5);
    });

    it('scales vertical coordinates with top/bottom crop offsets', () => {
      // Top of camera frame (lmY = 0) is cropped above the visible box: y = -31
      const mappedTop = mapCameraPointToArena(0.5, 0.0, params);
      expect(mappedTop.y).toBeCloseTo(-31, 5);

      // Bottom of camera frame (lmY = 1.0) is cropped below the visible box: y = -31 + 540 = 509
      const mappedBottom = mapCameraPointToArena(0.5, 1.0, params);
      expect(mappedBottom.y).toBeCloseTo(509, 5);
    });
  });

  describe('Object-fit contain fallback', () => {
    it('uses min scale and letterboxes rather than cropping', () => {
      const containParams = {
        boxWidth: 720,
        boxHeight: 480,
        videoWidth: 640,
        videoHeight: 480,
        objectFit: 'contain' as const,
        mirrored: true,
      };
      // W/vw = 720/640 = 1.125, H/vh = 480/480 = 1
      // s = min(1.125, 1) = 1.0
      // ox = (720 - 640 * 1) / 2 = 40 (letterbox pillars)
      // oy = (480 - 480 * 1) / 2 = 0
      const mapped = mapCameraPointToArena(0.5, 0.5, containParams);
      expect(mapped.scale).toBeCloseTo(1.0, 5);
      expect(mapped.offsetX).toBeCloseTo(40, 5);
      expect(mapped.offsetY).toBeCloseTo(0, 5);
      expect(mapped.x).toBeCloseTo(360, 5);
      expect(mapped.y).toBeCloseTo(240, 5);
    });
  });
});
