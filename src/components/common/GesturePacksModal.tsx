import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Check, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { db, getSetting, setSetting } from '../../db/db';

export interface GesturePackData {
  version: number;
  name: string;
  description: string;
  sensitivity: 'relaxed' | 'normal' | 'strict';
  holdDurationMs: number;
  cooldownMs: number;
  customGestures: { name: string; action: string }[];
  modeMappings: Record<string, Record<string, string>>;
}

export const GESTURE_PRESETS: GesturePackData[] = [
  {
    version: 1,
    name: 'Presentation Pro',
    description: 'Optimized for slide decks and conferences: relaxed flick detection and responsive laser pointer.',
    sensitivity: 'relaxed',
    holdDurationMs: 220,
    cooldownMs: 650,
    customGestures: [],
    modeMappings: {
      presentation: {
        Swipe_Right: 'NEXT',
        Swipe_Left: 'PREV',
        Swipe_Up: 'NEXT',
        Swipe_Down: 'PREV',
        Open_Palm: 'PAUSE',
        Closed_Fist: 'PLAY',
        Pointing_Up: 'CLICK',
        Victory: 'SCREENSHOT',
      },
    },
  },
  {
    version: 1,
    name: 'Kitchen Master',
    description: 'High-tolerance hold times suited for cooking with wet hands, alarms, and step-by-step recipe scrolling.',
    sensitivity: 'strict',
    holdDurationMs: 380,
    cooldownMs: 800,
    customGestures: [],
    modeMappings: {
      kitchen: {
        Swipe_Right: 'NEXT',
        Swipe_Left: 'PREV',
        Open_Palm: 'PAUSE',
        Closed_Fist: 'PLAY',
        Thumb_Up: 'VOLUME_UP',
        Thumb_Down: 'VOLUME_DOWN',
        Victory: 'SCREENSHOT',
      },
    },
  },
  {
    version: 1,
    name: 'Accessibility First',
    description: 'Designed for motor assistance: stable dwell hold, high-contrast skeleton, and spoken announcements.',
    sensitivity: 'normal',
    holdDurationMs: 350,
    cooldownMs: 750,
    customGestures: [],
    modeMappings: {
      cursor: {
        Pointing_Up: 'CLICK',
        Closed_Fist: 'CLICK',
        Open_Palm: 'PAUSE',
        Victory: 'SCREENSHOT',
      },
      scroll: {
        Thumb_Up: 'SCROLL_UP',
        Thumb_Down: 'SCROLL_DOWN',
        Pointing_Up: 'SCROLL_DOWN',
      },
    },
  },
];

export const GesturePacksModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPacksImported?: () => void;
}> = ({
  isOpen,
  onClose,
  onPacksImported,
}) => {
  const { t } = useTranslation();
  const [importedPack, setImportedPack] = useState<GesturePackData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const customList = await db.customGestures.toArray();
      const currentSensitivity = (await getSetting<string>('gesture_sensitivity', 'relaxed')) as 'relaxed' | 'normal' | 'strict';

      const packData: GesturePackData = {
        version: 1,
        name: 'My Custom AeroTouch Settings',
        description: 'Exported from AeroTouch Studio on ' + new Date().toLocaleDateString(),
        sensitivity: currentSensitivity,
        holdDurationMs: 250,
        cooldownMs: 600,
        customGestures: customList.map((g) => ({ name: g.name, action: g.action })),
        modeMappings: {},
      };

      const jsonStr = JSON.stringify(packData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AeroTouch_Gesture_Pack.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.warn('Export failed:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') {
          throw new Error('Invalid gesture pack format: Missing pack name or invalid JSON structure.');
        }
        setImportedPack(parsed as GesturePackData);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : 'Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const applyPack = async (pack: GesturePackData) => {
    try {
      if (pack.sensitivity) {
        await setSetting('gesture_sensitivity', pack.sensitivity);
      }
      onPacksImported?.();
      setSuccessMessage(`Applied "${pack.name}" successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        setImportedPack(null);
        onClose();
      }, 1500);
    } catch (err) {
      setValidationError('Failed to apply settings: ' + String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-elevated space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">
                {t('gesturePacks.title', 'Gesture Packs & Presets')}
              </h3>
              <p className="text-xs text-muted">
                {t('gesturePacks.subtitle', 'Export, import and switch gesture profiles in one click')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-secondary text-muted">
            ✕
          </button>
        </div>

        {/* 3 Ready Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {t('gesturePacks.presets', 'Ready Presets')}
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {GESTURE_PRESETS.map((preset) => (
              <div
                key={preset.name}
                className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border hover:border-primary/40 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-heading font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{preset.name}</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed mt-0.5">{preset.description}</p>
                </div>
                <button
                  onClick={() => applyPack(preset)}
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
                >
                  {t('gesturePacks.apply', 'Apply')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Import & Export Bar */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>{t('gesturePacks.export', 'Export My Pack')}</span>
          </button>

          <label className="flex-1 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-500" />
            <span>{t('gesturePacks.import', 'Import JSON Pack')}</span>
            <input type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Import Preview Modal Confirmation */}
        {importedPack && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 animate-in fade-in">
            <h4 className="font-heading font-bold text-xs text-cyan-600 dark:text-cyan-400">
              {t('gesturePacks.previewTitle', 'Preview Before Applying:')} {importedPack.name}
            </h4>
            <p className="text-[11px] text-muted">{importedPack.description}</p>
            <div className="text-[11px] font-mono text-foreground flex gap-4">
              <span>Sensitivity: {importedPack.sensitivity}</span>
              <span>Hold: {importedPack.holdDurationMs}ms</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => applyPack(importedPack)}
                className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                {t('gesturePacks.confirmApply', 'Confirm & Apply')}
              </button>
              <button
                onClick={() => setImportedPack(null)}
                className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-muted"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
