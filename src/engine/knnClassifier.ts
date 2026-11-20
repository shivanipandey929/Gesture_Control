import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getAllCustomGestures, type CustomGestureRecord, type NormalizedSample } from '../db/db';

/**
 * Normalizes 21 hand landmarks relative to wrist position (point 0)
 * and scales by hand size (wrist to middle MCP / max distance) for scale & translation invariance.
 */
export function normalizeLandmarks(landmarks: NormalizedLandmark[]): NormalizedSample {
  if (!landmarks || landmarks.length !== 21) {
    return { landmarks: [] };
  }

  const wrist = landmarks[0];

  // Translation invariant: subtract wrist coordinates
  const translated = landmarks.map((lm) => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: (lm.z ?? 0) - (wrist.z ?? 0),
  }));

  // Scale invariant: scale by distance to middle finger knuckle (point 9) or max distance
  const middleMcp = translated[9];
  let scale = Math.hypot(middleMcp.x, middleMcp.y, middleMcp.z);
  if (scale < 0.02) {
    // Fallback to max distance
    scale = Math.max(...translated.map((p) => Math.hypot(p.x, p.y, p.z)), 0.05);
  }

  const normalized = translated.map((p) => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  }));

  return { landmarks: normalized };
}

/**
 * Calculates Euclidean distance between two normalized 21-point hand poses
 */
export function calculatePoseDistance(a: NormalizedSample, b: NormalizedSample): number {
  if (!a.landmarks || !b.landmarks || a.landmarks.length !== 21 || b.landmarks.length !== 21) {
    return Infinity;
  }

  let sumSquares = 0;
  for (let i = 0; i < 21; i++) {
    const p1 = a.landmarks[i];
    const p2 = b.landmarks[i];
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    sumSquares += dx * dx + dy * dy + dz * dz;
  }

  return Math.sqrt(sumSquares / 21); // Mean Euclidean landmark error
}

export interface KNNMatchResult {
  gestureName: string;
  action: string;
  confidence: number;
  distance: number;
}

export class CustomGestureKNN {
  private customGestures: CustomGestureRecord[] = [];
  private readonly maxDistanceThreshold = 0.58; // Distance cutoff for positive recognition

  async loadFromDB(): Promise<void> {
    try {
      this.customGestures = await getAllCustomGestures();
    } catch (err) {
      console.warn('Failed to load custom gestures from IndexedDB:', err);
    }
  }

  classify(landmarks: NormalizedLandmark[], k = 3): KNNMatchResult | null {
    if (this.customGestures.length === 0 || !landmarks || landmarks.length !== 21) {
      return null;
    }

    const currentSample = normalizeLandmarks(landmarks);
    const neighborDistances: { gestureName: string; action: string; distance: number }[] = [];

    for (const record of this.customGestures) {
      for (const sample of record.samples) {
        const dist = calculatePoseDistance(currentSample, sample);
        neighborDistances.push({
          gestureName: record.name,
          action: record.action,
          distance: dist,
        });
      }
    }

    if (neighborDistances.length === 0) return null;

    // Sort by distance ascending
    neighborDistances.sort((a, b) => a.distance - b.distance);

    const nearestK = neighborDistances.slice(0, Math.min(k, neighborDistances.length));
    const closest = nearestK[0];

    if (closest.distance > this.maxDistanceThreshold) {
      return null; // Not close enough to any trained custom gesture
    }

    // Confidence derived inversely from distance
    const confidence = Math.max(0.7, Math.min(0.99, 1 - closest.distance / this.maxDistanceThreshold));

    return {
      gestureName: closest.gestureName,
      action: closest.action,
      confidence,
      distance: closest.distance,
    };
  }

  getTrainedCount(): number {
    return this.customGestures.length;
  }

  addInMemoryGesture(name: string, action: string, landmarksList: NormalizedLandmark[][]): void {
    this.customGestures.push({
      name,
      action,
      samples: landmarksList.map((lm) => normalizeLandmarks(lm)),
      createdAt: Date.now(),
      synced: false,
    });
  }

  clear(): void {
    this.customGestures = [];
  }
}

export const customKNN = new CustomGestureKNN();

