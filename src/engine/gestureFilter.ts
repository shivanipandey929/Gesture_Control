export type StaticSensitivity = 'relaxed' | 'normal' | 'strict';

export interface GestureThresholds {
  Open_Palm: number;
  Closed_Fist: number;
  Thumb_Up: number;
  Thumb_Down: number;
  Victory: number;
  Pointing_Up: number;
  default: number;
}

export interface GestureFilterConfig {
  confidenceThreshold?: number;
  stabilityDurationMs?: number;
  cooldownDurationMs?: number;
}

export const STATIC_SENSITIVITY_CONFIGS: Record<
  StaticSensitivity,
  { thresholds: GestureThresholds; holdDurationMs: number; cooldownMs: number }
> = {
  relaxed: {
    thresholds: {
      Open_Palm: 0.55,
      Closed_Fist: 0.60,
      Thumb_Up: 0.55,
      Thumb_Down: 0.55,
      Victory: 0.55,
      Pointing_Up: 0.55,
      default: 0.55,
    },
    holdDurationMs: 250,
    cooldownMs: 600,
  },
  normal: {
    thresholds: {
      Open_Palm: 0.65,
      Closed_Fist: 0.70,
      Thumb_Up: 0.65,
      Thumb_Down: 0.65,
      Victory: 0.65,
      Pointing_Up: 0.65,
      default: 0.65,
    },
    holdDurationMs: 300,
    cooldownMs: 600,
  },
  strict: {
    thresholds: {
      Open_Palm: 0.75,
      Closed_Fist: 0.80,
      Thumb_Up: 0.75,
      Thumb_Down: 0.75,
      Victory: 0.75,
      Pointing_Up: 0.75,
      default: 0.75,
    },
    holdDurationMs: 350,
    cooldownMs: 700,
  },
};

export interface GestureFilterTelemetry {
  candidateGesture: string;
  candidateScore: number;
  thresholdNeeded: number;
  holdTimeHeldMs: number;
  holdRequiredMs: number;
  stabilityProgress: number; // 0..1
  inCooldown: boolean;
  cooldownRemainingMs: number;
  whyNotFired: string;
}

export class GestureFilter {
  private sensitivity: StaticSensitivity = 'relaxed';
  private customConfig: GestureFilterConfig | null = null;
  private candidateGesture: string = 'None';
  private candidateStartTime: number = 0;
  private lastTriggeredActionTime: number = -100000;
  private activeStableGesture: string = 'None';

  public telemetry: GestureFilterTelemetry = {
    candidateGesture: 'None',
    candidateScore: 0,
    thresholdNeeded: 0.55,
    holdTimeHeldMs: 0,
    holdRequiredMs: 250,
    stabilityProgress: 0,
    inCooldown: false,
    cooldownRemainingMs: 0,
    whyNotFired: 'No hand detected',
  };

  constructor(sensitivityOrConfig: StaticSensitivity | GestureFilterConfig = 'relaxed') {
    if (typeof sensitivityOrConfig === 'string') {
      this.setSensitivity(sensitivityOrConfig);
    } else if (typeof sensitivityOrConfig === 'object') {
      this.updateConfig(sensitivityOrConfig);
    }
  }

  setSensitivity(s: StaticSensitivity) {
    this.sensitivity = s;
    this.customConfig = null;
    const cfg = STATIC_SENSITIVITY_CONFIGS[s];
    this.telemetry.holdRequiredMs = cfg.holdDurationMs;
  }

  updateConfig(config: GestureFilterConfig) {
    this.customConfig = { ...(this.customConfig || {}), ...config };
    if (this.customConfig.stabilityDurationMs) {
      this.telemetry.holdRequiredMs = this.customConfig.stabilityDurationMs;
    }
  }

  getConfig(): GestureFilterConfig {
    if (this.customConfig) {
      return {
        confidenceThreshold: this.customConfig.confidenceThreshold ?? 0.7,
        stabilityDurationMs: this.customConfig.stabilityDurationMs ?? 350,
        cooldownDurationMs: this.customConfig.cooldownDurationMs ?? 600,
      };
    }
    const cfg = STATIC_SENSITIVITY_CONFIGS[this.sensitivity];
    return {
      confidenceThreshold: cfg.thresholds.default,
      stabilityDurationMs: cfg.holdDurationMs,
      cooldownDurationMs: cfg.cooldownMs,
    };
  }

  getThresholdFor(gesture: string): number {
    if (this.customConfig?.confidenceThreshold !== undefined) {
      return this.customConfig.confidenceThreshold;
    }
    const cfg = STATIC_SENSITIVITY_CONFIGS[this.sensitivity];
    return (cfg.thresholds as unknown as Record<string, number>)[gesture] ?? cfg.thresholds.default;
  }

  getHoldDurationMs(gesture?: string): number {
    if (gesture === 'Victory') {
      return 600;
    }
    if (this.customConfig?.stabilityDurationMs !== undefined) {
      return this.customConfig.stabilityDurationMs;
    }
    return STATIC_SENSITIVITY_CONFIGS[this.sensitivity].holdDurationMs;
  }

  getCooldownMs(gesture?: string): number {
    if (gesture === 'Victory') {
      return 2000;
    }
    if (this.customConfig?.cooldownDurationMs !== undefined) {
      return this.customConfig.cooldownDurationMs;
    }
    return STATIC_SENSITIVITY_CONFIGS[this.sensitivity].cooldownMs;
  }

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
    const threshold = this.getThresholdFor(rawGesture);
    const holdDurationMs = this.getHoldDurationMs(rawGesture);
    const cooldownMs = this.getCooldownMs(rawGesture);

    const timeSinceLastAction = timestamp - this.lastTriggeredActionTime;
    const inCooldown = timeSinceLastAction < cooldownMs;
    const cooldownRemainingMs = inCooldown ? cooldownMs - timeSinceLastAction : 0;

    this.telemetry.candidateGesture = rawGesture;
    this.telemetry.candidateScore = confidence;
    this.telemetry.thresholdNeeded = threshold;
    this.telemetry.inCooldown = inCooldown;
    this.telemetry.cooldownRemainingMs = cooldownRemainingMs;
    this.telemetry.holdRequiredMs = holdDurationMs;

    // 1. None or below required threshold
    if (rawGesture === 'None' || rawGesture === '') {
      this.candidateGesture = 'None';
      this.candidateStartTime = 0;
      this.activeStableGesture = 'None';
      this.telemetry.holdTimeHeldMs = 0;
      this.telemetry.stabilityProgress = 0;
      this.telemetry.whyNotFired = 'No recognized gesture';
      return {
        filteredGesture: 'None',
        isTriggered: false,
        stabilityProgress: 0,
        inCooldown,
      };
    }

    if (confidence < threshold) {
      this.candidateGesture = 'None';
      this.candidateStartTime = 0;
      this.telemetry.holdTimeHeldMs = 0;
      this.telemetry.stabilityProgress = 0;
      this.telemetry.whyNotFired = `Confidence too low (${(confidence * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}%)`;
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: 0,
        inCooldown,
      };
    }

    // 2. Dynamic Swipe Gestures: instant trigger without hold requirement
    if (rawGesture === 'Swipe_Left' || rawGesture === 'Swipe_Right') {
      if (!inCooldown) {
        this.lastTriggeredActionTime = timestamp;
        this.activeStableGesture = rawGesture;
        this.telemetry.whyNotFired = 'Fired immediately!';
        this.telemetry.stabilityProgress = 1;
        return {
          filteredGesture: rawGesture,
          isTriggered: true,
          stabilityProgress: 1,
          inCooldown: false,
        };
      }
      this.telemetry.whyNotFired = `Cooldown active (${cooldownRemainingMs}ms)`;
      return {
        filteredGesture: rawGesture,
        isTriggered: false,
        stabilityProgress: 1,
        inCooldown: true,
      };
    }

    // 3. Static gesture hold tracking (Time-based milliseconds)
    if (rawGesture !== this.candidateGesture) {
      this.candidateGesture = rawGesture;
      this.candidateStartTime = timestamp;
      this.telemetry.holdTimeHeldMs = 0;
      this.telemetry.stabilityProgress = 0;
      this.telemetry.whyNotFired = inCooldown
        ? `Cooldown active (${cooldownRemainingMs}ms)`
        : 'Hold starting...';
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: 0,
        inCooldown,
      };
    }

    // Calculate time held
    const heldMs = timestamp - this.candidateStartTime;
    this.telemetry.holdTimeHeldMs = heldMs;
    const progress = Math.min(heldMs / holdDurationMs, 1.0);
    this.telemetry.stabilityProgress = progress;

    if (heldMs < holdDurationMs) {
      this.telemetry.whyNotFired = inCooldown
        ? `Cooldown active (${cooldownRemainingMs}ms)`
        : `Hold not finished (${heldMs}ms / ${holdDurationMs}ms)`;
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: progress,
        inCooldown,
      };
    }

    // Held for >= holdDurationMs
    const isNewGesture = this.activeStableGesture !== this.candidateGesture;
    this.activeStableGesture = this.candidateGesture;

    if (inCooldown) {
      this.telemetry.whyNotFired = `Cooldown active (${cooldownRemainingMs}ms)`;
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: false,
        stabilityProgress: 1.0,
        inCooldown: true,
      };
    }

    if (isNewGesture) {
      this.lastTriggeredActionTime = timestamp;
      this.telemetry.whyNotFired = 'Fired successfully!';
      return {
        filteredGesture: this.activeStableGesture,
        isTriggered: true,
        stabilityProgress: 1.0,
        inCooldown: false,
      };
    }

    this.telemetry.whyNotFired = 'Gesture already held and active';
    return {
      filteredGesture: this.activeStableGesture,
      isTriggered: false,
      stabilityProgress: 1.0,
      inCooldown: false,
    };
  }

  reset() {
    this.candidateGesture = 'None';
    this.candidateStartTime = 0;
    this.lastTriggeredActionTime = -100000;
    this.activeStableGesture = 'None';
    this.telemetry.whyNotFired = 'Reset';
  }
}
