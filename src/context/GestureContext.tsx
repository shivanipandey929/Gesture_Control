import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { logGestureEvent, checkGestureAchievements } from '../db/db';
import i18n from '../i18n';
import { voiceService } from '../services/voice';

const GESTURE_KEY_MAP: Record<string, string> = {
  Open_Palm: 'gestures.openPalm',
  Closed_Fist: 'gestures.closedFist',
  Swipe_Right: 'gestures.swipeRight',
  Swipe_Left: 'gestures.swipeLeft',
  Swipe_Up: 'gestures.swipeUp',
  Swipe_Down: 'gestures.swipeDown',
  Thumb_Up: 'gestures.thumbUp',
  Thumb_Down: 'gestures.thumbDown',
  Pointing_Up: 'gestures.pointingUp',
  Victory: 'gestures.victory',
};

const ACTION_KEY_MAP: Record<string, string> = {
  PAUSE: 'gestures.openPalmAction',
  PLAY: 'gestures.closedFistAction',
  NEXT: 'gestures.swipeRightAction',
  PREV: 'gestures.swipeLeftAction',
  VOLUME_UP: 'gestures.thumbUpAction',
  VOLUME_DOWN: 'gestures.thumbDownAction',
  CLICK: 'gestures.pointingUpAction',
  SCREENSHOT: 'gestures.victoryAction',
  SCROLL_UP: 'gestures.scrollUpAction',
  SCROLL_DOWN: 'gestures.scrollDownAction',
};

export type GestureAction =
  | 'PAUSE'
  | 'PLAY'
  | 'NEXT'
  | 'PREV'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'SCREENSHOT'
  | 'CLICK'
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'HELLO'
  | 'NONE';

export interface ActionPayload {
  action: GestureAction;
  gesture: string;
  confidence: number;
  mode: string;
  timestamp: number;
}

export type ActionCallback = (payload: ActionPayload) => void;

interface GestureToast {
  id: string;
  gesture: string;
  action: string;
  timestamp: number;
}

interface GestureContextType {
  activeMode: string;
  setActiveMode: (mode: string) => void;
  dispatchAction: (gesture: string, confidence?: number) => GestureAction;
  subscribe: (callback: ActionCallback) => () => void;
  recentAction: ActionPayload | null;
  toasts: GestureToast[];
  dismissToast: (id: string) => void;
  swipeVelocityThreshold: number;
  setSwipeVelocityThreshold: (val: number) => void;
}

const GestureContext = createContext<GestureContextType | undefined>(undefined);

// Per-mode mapping specification
export const MODE_GESTURE_MAP: Record<string, Record<string, GestureAction>> = {
  presentation: {
    Swipe_Right: 'NEXT',
    Swipe_Left: 'PREV',
    Swipe_Up: 'NEXT',
    Swipe_Down: 'PREV',
    Open_Palm: 'PAUSE',
    Closed_Fist: 'PLAY',
    Victory: 'SCREENSHOT',
  },
  media: {
    Closed_Fist: 'PLAY',
    Open_Palm: 'PAUSE',
    Thumb_Up: 'VOLUME_UP',
    Thumb_Down: 'VOLUME_DOWN',
    Victory: 'SCREENSHOT',
    Swipe_Right: 'NEXT',
    Swipe_Left: 'PREV',
  },
  scroll: {
    Thumb_Up: 'SCROLL_UP',
    Thumb_Down: 'SCROLL_DOWN',
    Pointing_Up: 'SCROLL_DOWN',
    Open_Palm: 'PAUSE',
    Swipe_Right: 'NEXT',
    Swipe_Left: 'PREV',
    Swipe_Up: 'SCROLL_UP',
    Swipe_Down: 'SCROLL_DOWN',
  },
  cursor: {
    Pointing_Up: 'CLICK',
    Closed_Fist: 'CLICK',
    Open_Palm: 'PAUSE',
    Victory: 'SCREENSHOT',
  },
  kitchen: {
    Open_Palm: 'PAUSE',
    Closed_Fist: 'PLAY',
    Swipe_Right: 'NEXT',
    Swipe_Left: 'PREV',
    Pointing_Up: 'SCROLL_DOWN',
  },
  practice: {
    Open_Palm: 'PAUSE',
  },
  general: {
    Wave: 'HELLO',
    Open_Palm: 'PAUSE',
    Closed_Fist: 'PLAY',
    Swipe_Right: 'NEXT',
    Swipe_Left: 'PREV',
    Thumb_Up: 'VOLUME_UP',
    Thumb_Down: 'VOLUME_DOWN',
    Pointing_Up: 'CLICK',
    Victory: 'SCREENSHOT',
  },
};

export const GestureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMode, setActiveMode] = useState<string>('general');
  const [recentAction, setRecentAction] = useState<ActionPayload | null>(null);
  const [toasts, setToasts] = useState<GestureToast[]>([]);
  const [swipeVelocityThreshold, setSwipeVelocityThresholdState] = useState<number>(() => {
    return Number(localStorage.getItem('aerotouch_swipe_threshold') ?? 0.65);
  });

  const subscribersRef = useRef<Set<ActionCallback>>(new Set());
  const lastActionTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const setSwipeVelocityThreshold = (val: number) => {
    setSwipeVelocityThresholdState(val);
    localStorage.setItem('aerotouch_swipe_threshold', String(val));
  };

  const subscribe = useCallback((callback: ActionCallback) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const playFeedbackBeep = (action: GestureAction) => {
    try {
      if (!audioCtxRef.current) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioClass) {
          audioCtxRef.current = new AudioClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      let freq = 520;
      if (action === 'PLAY' || action === 'NEXT') freq = 660;
      else if (action === 'PAUSE' || action === 'PREV') freq = 440;
      else if (action === 'VOLUME_UP') freq = 880;
      else if (action === 'VOLUME_DOWN') freq = 330;
      else if (action === 'CLICK') freq = 740;
      else if (action === 'SCREENSHOT') freq = 990;

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio is progressive enhancement
    }
  };

  const dispatchAction = useCallback(
    (gesture: string, confidence: number = 0.9): GestureAction => {
      const now = Date.now();
      // Enforce strict 600ms cooldown
      if (now - lastActionTimeRef.current < 600) {
        return 'NONE';
      }

      // Strict protection for practice mode:
      // While a Practice tab is active, disable global SCREENSHOT, volume, and click actions.
      if (activeMode === 'practice') {
        if (
          gesture === 'Victory' ||
          gesture === 'Pointing_Up' ||
          gesture === 'Thumb_Up' ||
          gesture === 'Thumb_Down'
        ) {
          return 'NONE';
        }
      }

      // Map action according to current active workspace mode
      const currentMap = MODE_GESTURE_MAP[activeMode] || MODE_GESTURE_MAP.general;
      let action: GestureAction = currentMap[gesture] || 'NONE';

      // Fallback to general only if NOT in practice mode
      if (action === 'NONE' && activeMode !== 'practice') {
        action = MODE_GESTURE_MAP.general[gesture] || 'NONE';
      }

      // Double-check: in practice mode, never allow SCREENSHOT, CLICK, or VOLUME
      if (
        activeMode === 'practice' &&
        (action === 'SCREENSHOT' || action === 'CLICK' || action === 'VOLUME_UP' || action === 'VOLUME_DOWN')
      ) {
        return 'NONE';
      }

      if (action === 'NONE') {
        return 'NONE';
      }

      lastActionTimeRef.current = now;

      const payload: ActionPayload = {
        action,
        gesture,
        confidence,
        mode: activeMode,
        timestamp: now,
      };

      setRecentAction(payload);

      // Play soft feedback audio
      playFeedbackBeep(action);

      // Save to IndexedDB
      logGestureEvent(gesture, action, confidence, activeMode);

      // Check achievements
      checkGestureAchievements(gesture).then((unlocked) => {
        if (unlocked) {
          const achToast: GestureToast = {
            id: Math.random().toString(36).substring(2, 9),
            gesture: '🏆 Achievement',
            action: unlocked,
            timestamp: Date.now(),
          };
          setToasts((prev) => [achToast, ...prev.slice(0, 2)]);
          setTimeout(() => {
            dismissToast(achToast.id);
          }, 4500);
        }
      });

      // Broadcast to all mounted subscribers
      subscribersRef.current.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error('Subscriber error:', e);
        }
      });

      // Show friendly action toast in the active language: e.g. "Open Palm -> Pause"
      const gestureI18nKey = GESTURE_KEY_MAP[gesture];
      const actionI18nKey = ACTION_KEY_MAP[action];
      const formatGesture = gestureI18nKey
        ? i18n.t(gestureI18nKey, { defaultValue: gesture.replace('_', ' ') })
        : gesture.replace('_', ' ');
      const formatAction = actionI18nKey
        ? i18n.t(actionI18nKey, { defaultValue: action.replace('_', ' ') })
        : action.replace('_', ' ');

      const newToast: GestureToast = {
        id: Math.random().toString(36).substring(2, 9),
        gesture: formatGesture,
        action: formatAction,
        timestamp: now,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);
      setTimeout(() => {
        dismissToast(newToast.id);
      }, 2600);

      // Speak feedback in current language if speech feedback is enabled
      try {
        if (voiceService.isEnabled) {
          voiceService.handleAction(action, gesture);
        }
      } catch {
        // Fallback
      }

      return action;
    },
    [activeMode]
  );

  return (
    <GestureContext.Provider
      value={{
        activeMode,
        setActiveMode,
        dispatchAction,
        subscribe,
        recentAction,
        toasts,
        dismissToast,
        swipeVelocityThreshold,
        setSwipeVelocityThreshold,
      }}
    >
      {children}

      {/* Floating Action Toasts (mirrors in RTL) */}
      <div className="fixed top-20 right-6 fixed-top-right z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="px-4 py-2.5 rounded-xl bg-[#111827]/95 border border-cyan-500/40 text-white shadow-lg backdrop-blur-md flex items-center gap-2.5 text-xs font-heading font-semibold animate-slide-in pointer-events-auto"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-300 font-bold">{toast.gesture}</span>
            <span className="text-slate-400">→</span>
            <span className="text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {toast.action}
            </span>
          </div>
        ))}
      </div>
    </GestureContext.Provider>
  );
};

export function useGesture() {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGesture must be used within a GestureProvider');
  }
  return context;
}
