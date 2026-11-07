import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Eye,
  Laptop
} from 'lucide-react';
import { actionDispatcher, DEFAULT_GESTURE_MAP, type SemanticAction } from '../engine/actionDispatcher';
import { useAccessibility } from '../context/AccessibilityContext';

const AVAILABLE_ACTIONS: { id: SemanticAction; label: string }[] = [
  { id: 'play', label: 'Play' },
  { id: 'pause', label: 'Pause' },
  { id: 'next', label: 'Next / Forward' },
  { id: 'previous', label: 'Previous / Back' },
  { id: 'volume_up', label: 'Volume Up' },
  { id: 'volume_down', label: 'Volume Down' },
  { id: 'cursor_move', label: 'Move Cursor' },
  { id: 'screenshot', label: 'Screenshot Snapshot' },
  { id: 'none', label: 'Disabled (None)' },
];

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useAccessibility();

  const [mapping, setMapping] = useState<Record<string, SemanticAction>>(() => actionDispatcher.getMapping());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => actionDispatcher.isSoundEnabled());
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(() => {
    return Number(localStorage.getItem('aerotouch_confidence') ?? 0.7);
  });
  const [stabilityMs, setStabilityMs] = useState<number>(() => {
    return Number(localStorage.getItem('aerotouch_stability') ?? 350);
  });
  const [cooldownMs, setCooldownMs] = useState<number>(() => {
    return Number(localStorage.getItem('aerotouch_cooldown') ?? 600);
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleActionChange = (gesture: string, action: SemanticAction) => {
    const updated = { ...mapping, [gesture]: action };
    setMapping(updated);
    actionDispatcher.updateMapping(updated);
    flashSaved();
  };

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    actionDispatcher.setSoundEnabled(val);
    flashSaved();
  };

  const flashSaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetDefaults = () => {
    setMapping({ ...DEFAULT_GESTURE_MAP });
    actionDispatcher.updateMapping({ ...DEFAULT_GESTURE_MAP });
    setSoundEnabled(true);
    actionDispatcher.setSoundEnabled(true);
    setConfidenceThreshold(0.7);
    setStabilityMs(350);
    setCooldownMs(600);
    localStorage.removeItem('aerotouch_confidence');
    localStorage.removeItem('aerotouch_stability');
    localStorage.removeItem('aerotouch_cooldown');
    updateSettings({
      accessibilityMode: false,
      highContrast: false,
      largeText: false,
      dwellClick: true,
      lowEndLaptopMode: false,
    });
    flashSaved();
  };

  const saveThresholds = () => {
    localStorage.setItem('aerotouch_confidence', String(confidenceThreshold));
    localStorage.setItem('aerotouch_stability', String(stabilityMs));
    localStorage.setItem('aerotouch_cooldown', String(cooldownMs));
    flashSaved();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Engine & Accessibility Settings
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Customize action mappings, accessibility accommodations, and low-end hardware modes.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 text-xs font-mono animate-pulse">
            <Check className="w-3.5 h-3.5" />
            Preferences Saved!
          </div>
        )}
      </div>

      {/* Accessibility Mode Suite */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-violet-500/40 flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-950/80 border border-violet-700 text-violet-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Accessibility Mode</h2>
              <p className="text-xs text-slate-400">
                Enhanced contrast, slower gesture thresholds (500ms), dwell click, and readable typography
              </p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ accessibilityMode: !settings.accessibilityMode })}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${settings.accessibilityMode
                ? 'bg-violet-500 text-slate-950 shadow-glow-violet'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
          >
            {settings.accessibilityMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Accessibility Features Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-slate-200">1.5s Dwell Click</div>
              <div className="text-slate-500 text-[11px]">Hover still 1.5s to trigger automatic click</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dwellClick}
              onChange={(e) => updateSettings({ dwellClick: e.target.checked })}
              className="accent-violet-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-slate-200">High Contrast Theme</div>
              <div className="text-slate-500 text-[11px]">Crisp borders and elevated luminance</div>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="accent-violet-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-slate-200">Large Readable Text</div>
              <div className="text-slate-500 text-[11px]">Expands body typography across pages</div>
            </div>
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(e) => updateSettings({ largeText: e.target.checked })}
              className="accent-violet-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-slate-200">One-Hand Control</div>
              <div className="text-slate-500 text-[11px]">Optimized for dominant single-hand usage</div>
            </div>
            <input
              type="checkbox"
              checked={settings.oneHandControl}
              onChange={(e) => updateSettings({ oneHandControl: e.target.checked })}
              className="accent-violet-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Low-End Laptop Mode & Performance Meter */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Low-End Laptop Mode</h2>
              <p className="text-xs text-slate-400">
                Lowers webcam resolution (320x240) and limits target FPS (15-20) to save battery and reduce CPU thermal load
              </p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ lowEndLaptopMode: !settings.lowEndLaptopMode })}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${settings.lowEndLaptopMode
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
          >
            {settings.lowEndLaptopMode ? 'Active' : 'Off'}
          </button>
        </div>

        {/* Live Hardware Meter */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[11px] text-slate-400">Camera Target</div>
            <div className="font-mono text-cyan-300 font-bold text-sm">
              {settings.lowEndLaptopMode ? '320 × 240' : '640 × 480'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Target FPS</div>
            <div className="font-mono text-cyan-300 font-bold text-sm">
              {settings.lowEndLaptopMode ? '15 - 20 FPS' : '30 - 60 FPS'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Inference Core</div>
            <div className="font-mono text-emerald-400 font-bold text-sm">WASM SIMD</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Tab Throttle</div>
            <div className="font-mono text-violet-300 font-bold text-sm">Enabled</div>
          </div>
        </div>
      </div>

      {/* Gesture Remapping Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Gesture Action Mapping</h2>
            <p className="text-xs text-slate-400">Map standard hand poses and directional swipes to actions</p>
          </div>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(mapping).map((gesture) => (
            <div
              key={gesture}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-heading font-bold text-slate-200">
                  {gesture.replace('_', ' ')}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Input Gesture</div>
              </div>

              <select
                value={mapping[gesture]}
                onChange={(e) => handleActionChange(gesture, e.target.value as SemanticAction)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                {AVAILABLE_ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Timing and Sensitivity Sliders */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-6 shadow-2xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="font-heading font-bold text-lg text-white">Engine Filtering Parameters</h2>
          <p className="text-xs text-slate-400">Adjust temporal stability windows and cooldown lockouts</p>
        </div>

        <div className="space-y-6">
          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Confidence Threshold</span>
              <span className="font-mono text-cyan-400 font-bold">
                {(confidenceThreshold * 100).toFixed(0)}% (Default: 70%)
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => {
                setConfidenceThreshold(Number(e.target.value));
                saveThresholds();
              }}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Stability duration slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Stability Hold Duration</span>
              <span className="font-mono text-cyan-400 font-bold">{stabilityMs} ms (Default: 350 ms)</span>
            </div>
            <input
              type="range"
              min="150"
              max="800"
              step="50"
              value={stabilityMs}
              onChange={(e) => {
                setStabilityMs(Number(e.target.value));
                saveThresholds();
              }}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Cooldown duration slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Action Cooldown Lockout</span>
              <span className="font-mono text-violet-400 font-bold">{cooldownMs} ms (Default: 600 ms)</span>
            </div>
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={cooldownMs}
              onChange={(e) => {
                setCooldownMs(Number(e.target.value));
                saveThresholds();
              }}
              className="w-full accent-violet-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Audio Haptics */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">Sound Feedback Tones</h3>
            <p className="text-xs text-slate-400">
              Plays pleasant synthesized audio cues upon action execution via Web Audio API.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSoundToggle(!soundEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${soundEnabled
              ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
        >
          {soundEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};
