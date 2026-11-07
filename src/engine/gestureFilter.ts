export interface GestureFilterConfig {
  confidenceThreshold: number; // default 0.70
  stabilityDurationMs: number; // default 350ms
  cooldownDurationMs: number; // default 600ms
}

export class GestureFilter {
  private config: GestureFilterConfig;
  private candidateGesture: string = 'None';
  private candidateStartTime: number = 0;
  private lastTriggeredActionTime: number = 0;
  private activeStableGesture: string = 'None';

  constructor(config: Partial<GestureFilterConfig> = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      stabilityDurationMs: config.stabilityDurationMs ?? 350,
      cooldownDurationMs: config.cooldownDurationMs ?? 600,
    };
  }

  updateConfig(newConfig: Partial<GestureFilterConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): GestureFilterConfig {
    return { ...this.config };
  }

  /**
   * Filters raw detected gestures with confidence threshold, stability timer, and cooldown.
   * Returns: { filteredGesture, triggered, stabilityProgress (0 to 1), inCooldown }
   */
  process(
    rawGesture: string,
    confidence: number,
    timestamp: number
  ): {
    filteredGesture: string;
    isTriggered: boolean;
    stabilityProgress: number;
    inCooldown: boolean;
  } {
    const inCooldown = timestamp - this.lastTriggeredActionTime < this.config.cooldownDurationMs;

    // 1. Ignore if confidence is below threshold or gesture is None
    if (confidence < this.config.confidenceThreshold || rawGesture === 'None') {
      this.candidateGesture = 'None';
      this.candidateStartTime = 0;
      this.activeStableGesture = 'None';
      return {
        filteredGesture: 'None',
        isTriggered: false,
        stabilityProgress: 0,
        inCooldown,
      };
    }

    // 2. Dynamic gestures like swipes are processed with immediate trigger if detected
    if (rawGesture === 'Swipe_Left' || rawGesture === 'Swipe_Right') {
      if (!inCooldown) {
        this.lastTriggeredActionTime = timestamp;
        this.activeStableGesture = rawGesture;
        return {
          filteredGesture: rawGesture,
          isTriggered: true,
          stabilityProgress: 1,
          inCooldown: false,
        };
      }
      return {
        filteredGesture: rawGesture,
        isTriggered: false,
        stabilityProgress: 1,
        inCooldown: true,
      };
    }

    // 3. Static gesture stability tracking
    if (rawGesture !== this.candidateGesture) {
      this.candidateGesture = rawGesture;
      this.candidateStartTime = timestamp;
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: 0,
        inCooldown,
      };
    }

    // Candidate has remained consistent
    const heldDuration = timestamp - this.candidateStartTime;
    const stabilityProgress = Math.min(heldDuration / this.config.stabilityDurationMs, 1.0);

    // If held for >= 350ms
    if (heldDuration >= this.config.stabilityDurationMs) {
      const isNewGesture = this.activeStableGesture !== this.candidateGesture;
      this.activeStableGesture = this.candidateGesture;

      // Check if cooldown allows triggering an action
      if (!inCooldown && isNewGesture) {
        this.lastTriggeredActionTime = timestamp;
        return {
          filteredGesture: this.activeStableGesture,
          isTriggered: true,
          stabilityProgress: 1.0,
          inCooldown: false,
        };
      }

      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: 1.0,
        inCooldown,
      };
    }

    return {
      filteredGesture: this.activeStableGesture,
      isTriggered: false,
      stabilityProgress,
      inCooldown,
    };
  }

  reset() {
    this.candidateGesture = 'None';
    this.candidateStartTime = 0;
    this.lastTriggeredActionTime = 0;
    this.activeStableGesture = 'None';
  }
}

