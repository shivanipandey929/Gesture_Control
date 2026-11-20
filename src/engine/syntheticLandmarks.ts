import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

const createLm = (x: number, y: number, z: number = 0): NormalizedLandmark => ({
  x,
  y,
  z,
  visibility: 1,
});

/**
 * Procedural generator for 21-joint 3D synthetic hand landmarks.
 * Produces anatomically correct hand landmark coordinates for all test and demo gestures.
 */
export function generateSyntheticLandmarks(
  cx: number = 0.5,
  cy: number = 0.5,
  pose: string = 'Open_Palm'
): NormalizedLandmark[] {
  const lm: NormalizedLandmark[] = [];
  const wx = cx;
  const wy = cy + 0.16;
  lm[0] = createLm(wx, wy, 0); // Wrist

  const isPinch = pose === 'Pinch';
  const isPoint = pose === 'Pointing_Up';
  const isFist = pose === 'Closed_Fist';
  const isThumbUp = pose === 'Thumb_Up';
  const isVictory = pose === 'Victory';

  // Thumb
  if (isThumbUp) {
    lm[1] = createLm(wx - 0.04, wy - 0.04);
    lm[2] = createLm(wx - 0.07, wy - 0.08);
    lm[3] = createLm(wx - 0.08, wy - 0.14);
    lm[4] = createLm(wx - 0.08, wy - 0.20);
  } else if (isPinch) {
    lm[1] = createLm(wx - 0.03, wy - 0.05);
    lm[2] = createLm(wx - 0.05, wy - 0.09);
    lm[3] = createLm(wx - 0.035, wy - 0.13);
    lm[4] = createLm(cx - 0.015, cy - 0.07);
  } else if (isFist) {
    lm[1] = createLm(wx - 0.03, wy - 0.04);
    lm[2] = createLm(wx - 0.04, wy - 0.07);
    lm[3] = createLm(wx - 0.02, wy - 0.08);
    lm[4] = createLm(wx + 0.01, wy - 0.07);
  } else {
    lm[1] = createLm(wx - 0.04, wy - 0.04);
    lm[2] = createLm(wx - 0.07, wy - 0.08);
    lm[3] = createLm(wx - 0.10, wy - 0.12);
    lm[4] = createLm(wx - 0.13, wy - 0.15);
  }

  // Index
  lm[5] = createLm(wx - 0.045, wy - 0.14);
  if (isFist || isThumbUp) {
    lm[6] = createLm(wx - 0.045, wy - 0.17);
    lm[7] = createLm(wx - 0.035, wy - 0.15);
    lm[8] = createLm(wx - 0.03, wy - 0.12);
  } else if (isPinch) {
    lm[6] = createLm(wx - 0.04, wy - 0.18);
    lm[7] = createLm(wx - 0.025, wy - 0.14);
    lm[8] = createLm(cx - 0.015, cy - 0.07);
  } else {
    lm[6] = createLm(wx - 0.045, wy - 0.21);
    lm[7] = createLm(wx - 0.045, wy - 0.26);
    lm[8] = createLm(wx - 0.045, wy - 0.31);
  }

  // Middle
  lm[9] = createLm(wx - 0.01, wy - 0.15);
  if (isFist || isThumbUp || isPoint) {
    lm[10] = createLm(wx - 0.01, wy - 0.18);
    lm[11] = createLm(wx - 0.005, wy - 0.16);
    lm[12] = createLm(wx, wy - 0.13);
  } else {
    lm[10] = createLm(wx - 0.01, wy - 0.23);
    lm[11] = createLm(wx - 0.01, wy - 0.29);
    lm[12] = createLm(wx - 0.01, wy - 0.34);
  }

  // Ring
  lm[13] = createLm(wx + 0.025, wy - 0.14);
  if (isFist || isThumbUp || isPoint || isVictory) {
    lm[14] = createLm(wx + 0.025, wy - 0.17);
    lm[15] = createLm(wx + 0.02, wy - 0.15);
    lm[16] = createLm(wx + 0.015, wy - 0.12);
  } else {
    lm[14] = createLm(wx + 0.025, wy - 0.21);
    lm[15] = createLm(wx + 0.025, wy - 0.26);
    lm[16] = createLm(wx + 0.025, wy - 0.30);
  }

  // Pinky
  lm[17] = createLm(wx + 0.06, wy - 0.12);
  if (isFist || isThumbUp || isPoint || isVictory) {
    lm[18] = createLm(wx + 0.055, wy - 0.15);
    lm[19] = createLm(wx + 0.05, wy - 0.13);
    lm[20] = createLm(wx + 0.045, wy - 0.11);
  } else {
    lm[18] = createLm(wx + 0.06, wy - 0.18);
    lm[19] = createLm(wx + 0.06, wy - 0.22);
    lm[20] = createLm(wx + 0.06, wy - 0.26);
  }

  return lm;
}
