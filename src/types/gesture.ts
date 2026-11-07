import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType =
  | 'None'
  | 'Closed_Fist'
  | 'Open_Palm'
  | 'Pointing_Up'
  | 'Thumb_Down'
  | 'Thumb_Up'
  | 'Victory'
  | 'ILoveYou'
  | 'Swipe_Left'
  | 'Swipe_Right'
  | 'Custom';

export type ActionType =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'volume_up'
  | 'volume_down'
  | 'cursor_move'
  | 'screenshot'
  | 'scroll_up'
  | 'scroll_down'
  | 'none';

export interface GestureDetectionResult {
  gesture: string;
  confidence: number;
  landmarks: NormalizedLandmark[][];
  handedness: string;
  fps: number;
  timestamp: number;
  rawGesture?: string;
  filteredGesture?: string;
  wristVelocity?: { vx: number; vy: number };
}

export interface CameraState {
  isStreaming: boolean;
  isLoading: boolean;
  isDenied: boolean;
  error?: string;
  deviceId?: string;
  brightness: number; // 0 to 255
  isLowLight: boolean;
}

export interface GestureEngineConfig {
  confidenceThreshold: number; // default 0.7
  stabilityDurationMs: number; // default 350ms
  cooldownDurationMs: number; // default 600ms
  smoothingAlpha: number; // for exponential moving average
  swipeThreshold: number; // velocity threshold
}

