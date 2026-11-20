import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  theme: 'dark' | 'light';
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
  theme: 'light',
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

  // Load from Dexie DB & LocalStorage
  useEffect(() => {
    async function load() {
      const saved = await getSetting<AccessibilitySettings>('user_accessibility_settings', DEFAULT_SETTINGS);
      const storedTheme = (localStorage.getItem('theme') || localStorage.getItem('aerotouch_theme')) as 'dark' | 'light' | null;
      const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolvedTheme: 'dark' | 'light' = storedTheme || (systemPrefersDark ? 'dark' : 'light');
      
      saved.theme = resolvedTheme;
      setSettings(saved);

      if (saved.highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      if (saved.largeText) {
        document.documentElement.classList.add('text-lg-mode');
      }
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light-theme');
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
      if (merged.theme) {
        localStorage.setItem('theme', merged.theme);
        localStorage.setItem('aerotouch_theme', merged.theme);
        if (merged.theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light-theme');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light-theme');
        }
      }

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

      if (merged.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light-theme');
      }

      return merged;
    });
  };

  // Continuous hand tracker for fatigue reminder (3 minutes = 180 seconds)
  // Only counts while a hand is actively detected in the camera feed.
  const isHandActiveRef = useRef<boolean>(false);

  const recordHandPresence = (present: boolean) => {
    isHandActiveRef.current = present;
    if (!present) {
      setContinuousHandSeconds(0);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (isHandActiveRef.current) {
        setContinuousHandSeconds((prev) => {
          const next = prev + 1;
          if (next >= 180 && !showFatigueNotice) {
            setShowFatigueNotice(true);
          }
          return next;
        });
      }
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
        <div className="fixed top-20 right-6 z-50 max-w-sm p-5 rounded-2xl panel-card border-2 border-warning bg-surface text-foreground shadow-elevated animate-bounce">
          <div className="flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="coffee">☕</span>
            <div className="flex-1">
              <h4 className="font-heading font-bold text-foreground text-base mb-1">
                Take a Friendly Rest!
              </h4>
              <p className="text-xs text-muted leading-relaxed mb-3">
                You've been holding your hand up continuously for over <strong>3 minutes</strong>. Lower your arm, relax your shoulder, and shake out your wrist to prevent strain.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={dismissFatigueNotice}
                  className="px-4 py-2 rounded-xl bg-warning hover:opacity-90 text-white font-heading text-xs font-semibold transition-opacity"
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

