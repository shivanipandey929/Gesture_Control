export type SemanticAction =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'volume_up'
  | 'volume_down'
  | 'cursor_move'
  | 'screenshot'
  | 'none';

export type GestureMapping = Record<string, SemanticAction>;

export const DEFAULT_GESTURE_MAP: GestureMapping = {
  Open_Palm: 'pause',
  Closed_Fist: 'play',
  Swipe_Right: 'next',
  Swipe_Left: 'previous',
  Thumb_Up: 'volume_up',
  Thumb_Down: 'volume_down',
  Pointing_Up: 'cursor_move',
  Victory: 'screenshot',
};

export interface ActionEventDetail {
  action: SemanticAction;
  gesture: string;
  timestamp: number;
}

type ActionSubscriber = (detail: ActionEventDetail) => void;

class ActionDispatcher {
  private gestureMap: GestureMapping = { ...DEFAULT_GESTURE_MAP };
  private subscribers: Set<ActionSubscriber> = new Set();
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Load persisted map if available in localStorage
    try {
      const saved = localStorage.getItem('aerotouch_gesture_map');
      if (saved) {
        this.gestureMap = { ...DEFAULT_GESTURE_MAP, ...JSON.parse(saved) };
      }
      const soundSaved = localStorage.getItem('aerotouch_sound_enabled');
      if (soundSaved !== null) {
        this.soundEnabled = soundSaved === 'true';
      }
    } catch {
      // ignore
    }
  }

  getMapping(): GestureMapping {
    return { ...this.gestureMap };
  }

  updateMapping(newMap: GestureMapping) {
    this.gestureMap = { ...newMap };
    try {
      localStorage.setItem('aerotouch_gesture_map', JSON.stringify(this.gestureMap));
    } catch {
      // ignore
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('aerotouch_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  subscribe(callback: ActionSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Dispatches the corresponding action for a triggered gesture
   */
  dispatch(gesture: string, timestamp = Date.now()): SemanticAction {
    const action = this.gestureMap[gesture] || 'none';
    if (action === 'none') return 'none';

    const detail: ActionEventDetail = { action, gesture, timestamp };

    // Emit to internal subscribers
    this.subscribers.forEach((fn) => {
      try {
        fn(detail);
      } catch (e) {
        console.error('Action subscriber error:', e);
      }
    });

    // Also dispatch as custom DOM event for cross-component listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aerotouch-action', { detail }));
    }

    if (this.soundEnabled) {
      this.playFeedbackTone(action);
    }

    return action;
  }

  private playFeedbackTone(action: SemanticAction) {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      let freq = 520;
      if (action === 'play') freq = 660;
      else if (action === 'pause') freq = 440;
      else if (action === 'volume_up') freq = 880;
      else if (action === 'volume_down') freq = 330;
      else if (action === 'next' || action === 'previous') freq = 750;
      else if (action === 'screenshot') freq = 990;

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio playback is purely progressive enhancement
    }
  }
}

export const actionDispatcher = new ActionDispatcher();

