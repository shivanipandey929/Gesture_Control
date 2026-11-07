import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSetting, setSetting } from '../db/db';

export interface AccessibilitySettings {
  accessibilityMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  dwellClick: boolean;
  dwellDurationMs: number; // default 1500ms
  oneHandControl: boolean;
  lowEndLaptopMode: boolean; // 320x240 @ 15-20 FPS
  sensitivity: number; // 0.5 to 1.0
  gestureThresholdMs: number; // 500ms when accessible vs 350ms standard
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  accessibilityMode: false,
  highContrast: false,
  largeText: false,
  dwellClick: true,
  dwellDurationMs: 1500,
  oneHandControl: true,
  lowEndLaptopMode: false,
  sensitivity: 0.7,
  gestureThresholdMs: 350,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  continuousHandSeconds: number;
  showFatigueNotice: boolean;
  dismissFatigueNotice: () => void;
  recordHandPresence: (present: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [continuousHandSeconds, setContinuousHandSeconds] = useState<number>(0);
  const [showFatigueNotice, setShowFatigueNotice] = useState<boolean>(false);

  // Load from Dexie DB
  useEffect(() => {
    async function load() {
      const saved = await getSetting<AccessibilitySettings>('user_accessibility_settings', DEFAULT_SETTINGS);
      setSettings(saved);
      if (saved.highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      if (saved.largeText) {
        document.documentElement.classList.add('text-lg-mode');
      }
    }
    load();
  }, []);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...updates };
      // If accessibilityMode is toggled on, automatically adjust gesture thresholds and high contrast
      if (updates.accessibilityMode === true && !prev.accessibilityMode) {
        merged.highContrast = true;
        merged.largeText = true;
        merged.gestureThresholdMs = 500;
        merged.dwellClick = true;
      }
      if (updates.accessibilityMode === false && prev.accessibilityMode) {
        merged.highContrast = false;
        merged.largeText = false;
        merged.gestureThresholdMs = 350;
      }

      setSetting('user_accessibility_settings', merged);

      // Apply HTML class modifications
      if (merged.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }

      if (merged.largeText) {
        document.documentElement.classList.add('text-lg-mode');
      } else {
        document.documentElement.classList.remove('text-lg-mode');
      }

      return merged;
    });
  };

  // Continuous hand tracker for fatigue reminder (3 minutes = 180 seconds)
  const recordHandPresence = (present: boolean) => {
    if (!present) {
      // Allow brief loss of tracking without instantly resetting, but decay
      setContinuousHandSeconds((prev) => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setContinuousHandSeconds((prev) => {
        const next = prev + 1;
        if (next >= 180 && !showFatigueNotice) {
          setShowFatigueNotice(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showFatigueNotice]);

  const dismissFatigueNotice = () => {
    setShowFatigueNotice(false);
    setContinuousHandSeconds(0); // Reset timer after acknowledged rest
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        continuousHandSeconds,
        showFatigueNotice,
        dismissFatigueNotice,
        recordHandPresence,
      }}
    >
      {children}

      {/* Fatigue Reminder Toast / Modal */}
      {showFatigueNotice && (
        <div className="fixed top-20 right-6 z-50 max-w-sm p-5 rounded-2xl glass-panel-glow border-2 border-amber-500 bg-[#0B1020]/95 shadow-2xl animate-bounce">
          <div className="flex items-start gap-3">
            <span className="text-2xl">☕</span>
            <div className="flex-1">
              <h4 className="font-heading font-bold text-white text-base mb-1">
                Take a Friendly Rest!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                You've been holding your hand up continuously for over <strong>3 minutes</strong>. Lower your arm, relax your shoulder, and shake out your wrist to prevent strain.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={dismissFatigueNotice}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-heading text-xs font-bold hover:bg-amber-400"
                >
                  I'm Rested, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

