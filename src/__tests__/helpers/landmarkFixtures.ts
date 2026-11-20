import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureFixturePose = 'open_palm' | 'closed_fist' | 'pointing_up' | 'swipe';

/**
 * Creates realistic 21-landmark 3D coordinate hand fixtures with physically plausible
 * wrist, palm base MCP joints, and finger extension/curling geometries.
 */
export function createRealistic21Landmarks(
  palmX = 0.5,
  palmY = 0.5,
  pose: GestureFixturePose = 'open_palm',
  fingersExtended?: number
): NormalizedLandmark[] {
  const lms: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: palmX,
    y: palmY,
    z: 0,
    visibility: 1,
  }));

  // Wrist (0): placed 0.15 below palm center
  lms[0] = { x: palmX, y: palmY + 0.15, z: 0, visibility: 1 };

  // Palm base MCPs: 5 (index), 9 (middle), 13 (ring), 17 (pinky)
  // Structured so sum of [0, 5, 9, 13, 17] / 5 == (palmX, palmY)
  lms[5] = { x: palmX - 0.06, y: palmY - 0.03, z: 0, visibility: 1 };
  lms[9] = { x: palmX - 0.02, y: palmY - 0.05, z: 0, visibility: 1 };
  lms[13] = { x: palmX + 0.02, y: palmY - 0.04, z: 0, visibility: 1 };
  lms[17] = { x: palmX + 0.06, y: palmY - 0.03, z: 0, visibility: 1 };

  // Thumb: 1 (CMC), 2 (MCP), 3 (IP), 4 (Tip)
  lms[1] = { x: palmX - 0.04, y: palmY + 0.08, z: 0, visibility: 1 };
  lms[2] = { x: palmX - 0.08, y: palmY + 0.03, z: 0, visibility: 1 };
  lms[3] = { x: palmX - 0.11, y: palmY - 0.01, z: 0, visibility: 1 };

  // Finger PIPs: 6, 10, 14, 18
  lms[6] = { x: palmX - 0.06, y: palmY - 0.10, z: 0, visibility: 1 };
  lms[10] = { x: palmX - 0.02, y: palmY - 0.12, z: 0, visibility: 1 };
  lms[14] = { x: palmX + 0.02, y: palmY - 0.11, z: 0, visibility: 1 };
  lms[18] = { x: palmX + 0.06, y: palmY - 0.09, z: 0, visibility: 1 };

  // Finger DIPs: 7, 11, 15, 19
  lms[7] = { x: palmX - 0.06, y: palmY - 0.18, z: 0, visibility: 1 };
  lms[11] = { x: palmX - 0.02, y: palmY - 0.20, z: 0, visibility: 1 };
  lms[15] = { x: palmX + 0.02, y: palmY - 0.19, z: 0, visibility: 1 };
  lms[19] = { x: palmX + 0.06, y: palmY - 0.17, z: 0, visibility: 1 };

  // Determine finger extension count
  let extendedCount: number;
  if (typeof fingersExtended === 'number') {
    extendedCount = fingersExtended;
  } else if (pose === 'closed_fist') {
    extendedCount = 0;
  } else if (pose === 'pointing_up') {
    extendedCount = 1;
  } else {
    // open_palm and swipe: all 5 extended
    extendedCount = 5;
  }

  const tipIndices = [4, 8, 12, 16, 20];
  const pipIndices = [2, 6, 10, 14, 18];

  for (let i = 0; i < 5; i++) {
    const tip = tipIndices[i];
    const pip = pipIndices[i];
    const isExtended = i < extendedCount;

    if (isExtended) {
      if (i === 0) {
        // Thumb extended outward
        lms[tip] = { x: palmX - 0.16, y: palmY - 0.04, z: 0, visibility: 1 };
      } else {
        // Finger extended upward, tip is far above PIP
        const xOffset = (i - 2) * 0.04;
        lms[tip] = { x: palmX + xOffset, y: palmY - 0.26, z: 0, visibility: 1 };
      }
    } else {
      if (i === 0) {
        // Thumb curled/tucked
        lms[tip] = { x: palmX, y: palmY + 0.03, z: 0, visibility: 1 };
      } else {
        // Finger curled into palm
        const xOffset = (i - 2) * 0.02;
        lms[tip] = { x: palmX + xOffset, y: palmY + 0.02, z: 0, visibility: 1 };
        lms[pip] = { x: palmX + xOffset, y: palmY + 0.01, z: 0, visibility: 1 };
      }
    }
  }

  return lms;
}
