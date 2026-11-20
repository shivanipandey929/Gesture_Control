import type { GestureAction } from '../context/GestureContext';
import type { SwipeTelemetry } from './swipeDetector';
import type { WaveTelemetry } from './waveDetector';

export interface GestureCategoryScore {
  categoryName: string;
  score: number;
}

export interface GestureEngineState {
  rawGesture: string;
  filteredGesture: string;
  confidence: number;
  lastAction: GestureAction | string | null;
  fps: number;
  cameraFps: number;
  isModelLoading: boolean;
  modelError: string | null;
  hasHand: boolean;
  isLowLight: boolean;
  brightness: number;
  inCooldown: boolean;
  stabilityProgress: number;
  holdTimeHeldMs: number;
  holdRequiredMs: number;
  isTabHidden: boolean;
  wristVelocity: { vx: number; vy: number };
  frameProcessingTimeMs: number;
  drawTimeMs: number;
  cameraFrameToResultMs: number;
  isCustomGesture: boolean;
  top3Categories: GestureCategoryScore[];
  swipeTelemetry: SwipeTelemetry;
  waveTelemetry: WaveTelemetry;
  whyNotFired: string;
  lowFpsWarning: boolean;
  brightnessBoost: boolean;
}

export interface CanvasEntry {
  canvas: HTMLCanvasElement;
  drawSkeleton: boolean;
  showGestureChip?: boolean;
  videoDimensions?: { width: number; height: number; objectFit?: 'cover' | 'contain' };
}
