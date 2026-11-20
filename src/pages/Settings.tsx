import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Eye,
  Laptop,
  Globe,
  Sun,
  Moon,
  Trophy,
  CheckCircle2,
  Hand,
  Camera,
  FolderOpen,
  Sparkles,
  Sliders as SlidersIcon,
  MessageSquare,
} from 'lucide-react';
import { actionDispatcher, DEFAULT_GESTURE_MAP, type SemanticAction } from '../engine/actionDispatcher';
import { masterGestureEngine } from '../engine';
import { useAccessibility } from '../context/AccessibilityContext';
import { useGesture } from '../context/GestureContext';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting, setSetting } from '../db/db';
import { LanguagePicker } from '../components/common/LanguagePicker';
import {
  getSavedDirectoryHandle,
  setSavedDirectoryHandle,
  enableScreenCapture,
  isScreenCaptureActive,
} from '../utils/snapshot';
import { GesturePacksModal } from '../components/common/GesturePacksModal';
import { PhraseBoardModal } from '../components/common/PhraseBoardModal';
import { voiceService } from '../services/voice';

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
  const { t } = useTranslation();
  const { settings, updateSettings } = useAccessibility();
  const { swipeVelocityThreshold, setSwipeVelocityThreshold } = useGesture();

  const achievements = useLiveQuery(() => db.achievements.toArray(), []);

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
  const [simulatedHand, setSimulatedHandState] = useState<boolean>(() => masterGestureEngine.isSimulatedHand);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Snapshot Settings
  const [snapshotMode, setSnapshotMode] = useState<'camera' | 'page' | 'screen'>('camera');
  const [folderName, setFolderName] = useState<string | null>(null);

  // Skeleton Settings
  const [skeletonStyle, setSkeletonStyle] = useState<'Clean' | 'Glow'>('Glow');
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // Volume & App Sounds
  const [volumeDialMode, setVolumeDialMode] = useState<'vertical_position' | 'fingertip_distance'>('vertical_position');
  const [appSoundVolume, setAppSoundVolume] = useState<number>(80);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => voiceService.isEnabled);

  const handleVoiceToggle = (val: boolean) => {
    voiceService.setEnabled(val);
    setVoiceEnabled(val);
    if (val) voiceService.unlock();
    flashSaved();
  };

  // Modals
  const [gesturePacksOpen, setGesturePacksOpen] = useState<boolean>(false);
  const [phraseBoardOpen, setPhraseBoardOpen] = useState<boolean>(false);

  // Load persisted settings from IndexedDB on mount
  React.useEffect(() => {
    getSetting<'camera' | 'page' | 'screen'>('snapshot_mode', 'camera').then(setSnapshotMode);
    getSavedDirectoryHandle().then((handle) => {
      if (handle) setFolderName(handle.name);
    });
    getSetting<'Clean' | 'Glow'>('skeleton_style', 'Glow').then((style) => {
      setSkeletonStyle(style);
      masterGestureEngine.skeletonStyle = style;
    });
    getSetting<boolean>('show_skeleton', true).then(setShowSkeleton);
    getSetting<'vertical_position' | 'fingertip_distance'>('volume_dial_mode', 'vertical_position').then(setVolumeDialMode);
    getSetting<number>('app_sound_volume', 80).then(setAppSoundVolume);
  }, []);

  const handleSnapshotModeChange = async (mode: 'camera' | 'page' | 'screen') => {
    if (mode === 'screen') {
      const active = await enableScreenCapture();
      if (!active) return;
    }
    setSnapshotMode(mode);
    await setSetting('snapshot_mode', mode);
    flashSaved();
  };

  const chooseSaveDirectory = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await (window as unknown as { showDirectoryPicker: (opts: { mode: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: 'readwrite' });
        await setSavedDirectoryHandle(handle);
        setFolderName(handle.name);
        flashSaved();
      } catch (err) {
        console.warn('Directory picker cancelled or unsupported:', err);
      }
    } else {
      alert('The File System Access API is supported in Google Chrome and Microsoft Edge.');
    }
  };

  const clearSaveDirectory = async () => {
    await setSavedDirectoryHandle(null);
    setFolderName(null);
    flashSaved();
  };

  const handleSkeletonStyleChange = async (style: 'Clean' | 'Glow') => {
    setSkeletonStyle(style);
    masterGestureEngine.skeletonStyle = style;
    await setSetting('skeleton_style', style);
    flashSaved();
  };

  const handleShowSkeletonToggle = async (show: boolean) => {
    setShowSkeleton(show);
    await setSetting('show_skeleton', show);
    flashSaved();
  };

  const handleVolumeDialModeChange = async (mode: 'vertical_position' | 'fingertip_distance') => {
    setVolumeDialMode(mode);
    await setSetting('volume_dial_mode', mode);
    flashSaved();
  };

  const handleAppSoundVolumeChange = async (vol: number) => {
    setAppSoundVolume(vol);
    await setSetting('app_sound_volume', vol);
    flashSaved();
  };

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
    setSwipeVelocityThreshold(0.65);
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
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
              Engine & Accessibility Settings
            </h1>
          </div>
          <p className="text-muted text-sm">
            Customize action mappings, accessibility accommodations, and low-end hardware modes.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved!</span>
          </div>
        )}
      </div>

      {/* Accessibility Mode Suite */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Accessibility Mode</h2>
              <p className="text-xs text-muted">
                Enhanced contrast, slower gesture thresholds (500ms), dwell click, and readable typography
              </p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ accessibilityMode: !settings.accessibilityMode })}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${settings.accessibilityMode
              ? 'bg-primary text-white shadow-card'
              : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
              }`}
          >
            {settings.accessibilityMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Accessibility Features Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-foreground">1.5s Dwell Click</div>
              <div className="text-muted text-[11px]">Hover still 1.5s to trigger automatic click</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dwellClick}
              onChange={(e) => updateSettings({ dwellClick: e.target.checked })}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-foreground">High Contrast Theme</div>
              <div className="text-muted text-[11px]">Crisp borders and elevated luminance</div>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-foreground">Large Readable Text</div>
              <div className="text-muted text-[11px]">Expands body typography across pages</div>
            </div>
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(e) => updateSettings({ largeText: e.target.checked })}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between">
            <div>
              <div className="font-heading font-bold text-foreground">One-Hand Control</div>
              <div className="text-muted text-[11px]">Optimized for dominant single-hand usage</div>
            </div>
            <input
              type="checkbox"
              checked={settings.oneHandControl}
              onChange={(e) => updateSettings({ oneHandControl: e.target.checked })}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Low-End Laptop Mode & Performance Meter */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Low-End Laptop Mode</h2>
              <p className="text-xs text-muted">
                Lowers webcam resolution (320x240) and limits target FPS to save battery and reduce CPU thermal load
              </p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ lowEndLaptopMode: !settings.lowEndLaptopMode })}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${settings.lowEndLaptopMode
              ? 'bg-primary text-white shadow-card'
              : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
              }`}
          >
            {settings.lowEndLaptopMode ? 'Active' : 'Off'}
          </button>
        </div>

        {/* Hardware Meter */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[11px] text-muted">Camera Target</div>
            <div className="font-mono text-primary font-bold text-sm">
              {settings.lowEndLaptopMode ? '320 × 240' : '640 × 480'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted">Target FPS</div>
            <div className="font-mono text-primary font-bold text-sm">
              {settings.lowEndLaptopMode ? '15 - 20 FPS' : '30 - 60 FPS'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted">Inference Core</div>
            <div className="font-mono text-success font-bold text-sm">WASM SIMD</div>
          </div>
          <div>
            <div className="text-[11px] text-muted">Tab Throttle</div>
            <div className="font-mono text-primary font-bold text-sm">Enabled</div>
          </div>
        </div>
      </div>

      {/* Gesture Remapping Card */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground">Gesture Action Mapping</h2>
            <p className="text-xs text-muted">Map standard hand poses and directional swipes to actions</p>
          </div>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground text-xs font-semibold shadow-soft"
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(mapping).map((gesture) => (
            <div
              key={gesture}
              className="p-3.5 rounded-xl bg-surface-secondary border border-border flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-heading font-bold text-foreground">
                  {gesture.replace('_', ' ')}
                </div>
                <div className="text-[11px] text-muted font-mono">Input Gesture</div>
              </div>

              <select
                value={mapping[gesture]}
                onChange={(e) => handleActionChange(gesture, e.target.value as SemanticAction)}
                className="bg-surface border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
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

      {/* Sensitivity Preset & Engine Filtering Parameters */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground">Sensitivity &amp; Engine Thresholds</h2>
            <p className="text-xs text-muted">Adjust overall sensitivity preset (Relaxed, Normal, Strict) and filter windows</p>
          </div>

          {/* Sensitivity Segmented Buttons */}
          <div className="flex p-1 rounded-xl bg-surface-secondary border border-border text-xs font-heading font-semibold">
            {(['relaxed', 'normal', 'strict'] as const).map((lvl) => {
              const currentLvl = (localStorage.getItem('aerotouch_sensitivity') as string) || 'relaxed';
              const isSel = currentLvl === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    localStorage.setItem('aerotouch_sensitivity', lvl);
                    if (lvl === 'relaxed') {
                      setConfidenceThreshold(0.55);
                      setStabilityMs(250);
                    } else if (lvl === 'normal') {
                      setConfidenceThreshold(0.65);
                      setStabilityMs(300);
                    } else {
                      setConfidenceThreshold(0.75);
                      setStabilityMs(350);
                    }
                    saveThresholds();
                  }}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${isSel
                    ? 'bg-surface text-primary font-bold shadow-soft border border-border'
                    : 'text-muted hover:text-foreground'
                    }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Swipe Velocity Sensitivity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Swipe Velocity Sensitivity</span>
              <span className="font-mono text-primary font-bold">
                {swipeVelocityThreshold.toFixed(2)} (Default: 0.65)
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="1.20"
              step="0.05"
              value={swipeVelocityThreshold}
              onChange={(e) => {
                setSwipeVelocityThreshold(Number(e.target.value));
                flashSaved();
              }}
              className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted font-mono">
              <span>Easier flick (0.30)</span>
              <span>Default (0.65)</span>
              <span>Firm flick (1.20)</span>
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Confidence Threshold</span>
              <span className="font-mono text-primary font-bold">
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
              className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
            />
          </div>

          {/* Stability duration slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Stability Hold Duration</span>
              <span className="font-mono text-primary font-bold">{stabilityMs} ms (Default: 350 ms)</span>
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
              className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
            />
          </div>

          {/* Cooldown duration slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Action Cooldown Lockout</span>
              <span className="font-mono text-primary font-bold">{cooldownMs} ms (Default: 600 ms)</span>
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
              className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Language & Theme Customization */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">Appearance & Language</h2>
          <p className="text-xs text-muted">Personalize your visual theme and interface language</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-secondary border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface border border-border text-primary shadow-soft">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-foreground">
                  {t('settings.language', 'App Language')}
                </div>
                <div className="text-[11px] text-muted">
                  {t('languagePicker.allLanguages', '23 Languages Supported')}
                </div>
              </div>
            </div>

            <LanguagePicker variant="navbar" onSelect={() => flashSaved()} />
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface border border-border text-warning shadow-soft">
                {settings.theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-foreground">Interface Theme</div>
                <div className="text-[11px] text-muted">Calm Dark / Clean Light</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = settings.theme === 'light' ? 'dark' : 'light';
                updateSettings({ theme: next });
                flashSaved();
              }}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-xs font-heading font-semibold text-foreground shadow-soft transition-colors"
            >
              {settings.theme === 'light' ? 'Light Theme Active' : 'Dark Theme Active'}
            </button>
          </div>
        </div>
      </div>

      {/* Spatial Mastery Achievements Showcase */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-warning">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Mastery Achievements</h2>
              <p className="text-xs text-muted">Earn badges stored locally in your IndexedDB</p>
            </div>
          </div>
          <span className="font-mono text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {achievements?.length || 0} / 3 Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {[
            {
              id: 'first_swipe',
              title: 'Air Flick Master',
              desc: 'Execute your first velocity swipe flick',
              icon: '👉',
            },
            {
              id: 'fifty_gestures',
              title: 'Gesture Enthusiast',
              desc: 'Log 50 total gestures across any workspace',
              icon: '⚡',
            },
            {
              id: 'streak_3_days',
              title: 'Consistent Navigator',
              desc: 'Use AeroTouch 3 days in a row',
              icon: '🔥',
            },
          ].map((badge) => {
            const isUnlocked = achievements?.some((a) => a.id === badge.id);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${isUnlocked
                  ? 'bg-primary/5 border-primary/30 text-foreground'
                  : 'bg-surface-secondary border-border opacity-60'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{badge.icon}</span>
                    {isUnlocked && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-foreground">{badge.title}</h4>
                  <p className="text-[11px] text-muted mt-1 leading-relaxed">{badge.desc}</p>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-muted">
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio Haptics */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-base">Sound Feedback Tones</h3>
            <p className="text-xs text-muted">
              Plays pleasant synthesized audio cues upon action execution via Web Audio API.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSoundToggle(!soundEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${soundEnabled
            ? 'bg-primary text-white shadow-card'
            : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
            }`}
        >
          {soundEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Spoken Voice Feedback */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-base">
              {t('settings.voiceFeedbackTitle', 'Spoken Voice Feedback')}
            </h3>
            <p className="text-xs text-muted">
              {t('settings.voiceFeedbackDesc', "Speaks action cues ('Slash', 'Pop', 'Next', 'Paused') with browser speech synthesis.")}
            </p>
            {!voiceService.hasVoiceAvailable && (
              <p className="text-[11px] text-amber-500 font-medium mt-1">
                {t('settings.voiceFeedbackNoVoice', 'No speech synthesis voice available in this browser.')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => handleVoiceToggle(!voiceEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${voiceEnabled
            ? 'bg-primary text-white shadow-card'
            : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
            }`}
        >
          {voiceEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Snapshot Settings */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-base">Snapshot Settings</h3>
              <p className="text-xs text-muted">
                Capture high-resolution snapshots with the Victory gesture or snapshot button.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              Capture Source Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'camera', label: 'Camera' },
                  { id: 'page', label: 'Page' },
                  { id: 'screen', label: 'Screen' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleSnapshotModeChange(mode.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-heading font-semibold border transition-all ${snapshotMode === mode.id
                      ? 'bg-primary text-white border-primary shadow-soft'
                      : 'bg-surface hover:bg-surface-secondary border-border text-foreground'
                    }`}
                >
                  {mode.label}
                  {mode.id === 'screen' && isScreenCaptureActive() && (
                    <span className="ml-1 text-[10px] text-green-300">●</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2">
              {snapshotMode === 'camera' && 'Captures mirrored camera stream with color-coded skeleton overlay & timestamp.'}
              {snapshotMode === 'page' && 'Captures the active interactive workspace or slide canvas directly.'}
              {snapshotMode === 'screen' && 'Captures any application or window using browser Screen Capture.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              Save Destination Folder
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={chooseSaveDirectory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-semibold bg-surface hover:bg-surface-secondary border border-border text-foreground transition-all shadow-soft"
              >
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>{folderName ? `Folder: ${folderName}` : 'Choose Save Folder'}</span>
              </button>
              {folderName && (
                <button
                  onClick={clearSaveDirectory}
                  className="px-3 py-2 rounded-xl text-xs font-heading font-semibold bg-surface hover:bg-surface-secondary border border-border text-rose-500 hover:text-rose-600 transition-all"
                  title="Reset to default Downloads folder"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted mt-2">
              {folderName
                ? `Snapshots will be saved directly into "${folderName}" without prompting.`
                : 'Default: automatic download to browser Downloads folder. Select a folder to auto-save directly.'}
            </p>
          </div>
        </div>
      </div>

      {/* Skeleton & Hand Tracking Display */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-base">Hand Skeleton & Tracking</h3>
              <p className="text-xs text-muted">
                Visual feedback and color-coded landmark styling across all workspaces and cameras.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleShowSkeletonToggle(!showSkeleton)}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${showSkeleton
                ? 'bg-primary text-white shadow-card'
                : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
              }`}
          >
            {showSkeleton ? 'Skeleton Visible' : 'Skeleton Hidden'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              Skeleton Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Clean', 'Glow'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSkeletonStyleChange(style)}
                  className={`py-2 px-3 rounded-xl text-xs font-heading font-semibold border transition-all ${skeletonStyle === style
                      ? 'bg-primary text-white border-primary shadow-soft'
                      : 'bg-surface hover:bg-surface-secondary border-border text-foreground'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2">
              {skeletonStyle === 'Glow'
                ? 'Fingertip radial glows, corner bounding brackets, and wrist gesture badges.'
                : 'Crisp, lightweight bone lines with solid gesture-colored joints.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              Gesture Color Coding
            </label>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Open Palm</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Closed Fist</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Pointing</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Victory</span>
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">Thumb Up</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Thumb Down</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">Pinch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume & Dial Controls */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <SlidersIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-base">Sound Volume & Dial Controls</h3>
            <p className="text-xs text-muted">
              Configure pinch dial mapping and global synthesized sound effects volume.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              App Sounds Volume: {appSoundVolume}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={appSoundVolume}
              onChange={(e) => handleAppSoundVolumeChange(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-secondary rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted mt-2">
              Controls feedback beeps, shutter sounds, and arcade game audio effects.
            </p>
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-foreground mb-2">
              Pinch Dial Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'vertical_position', label: 'Vertical Position' },
                  { id: 'fingertip_distance', label: 'Fingertip Distance' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleVolumeDialModeChange(mode.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-heading font-semibold border transition-all ${volumeDialMode === mode.id
                      ? 'bg-primary text-white border-primary shadow-soft'
                      : 'bg-surface hover:bg-surface-secondary border-border text-foreground'
                    }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2">
              {volumeDialMode === 'vertical_position'
                ? 'Holding a pinch moves volume smoothly based on hand height on screen.'
                : 'Volume is modulated by the distance between index tip and thumb tip.'}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60 text-muted text-xs leading-relaxed">
          <strong className="text-foreground">Notice:</strong> Web browsers only permit web applications to control audio within their own web pages and media players. Browser security sandboxes do not allow web pages to alter Windows system-level master audio output.
        </div>
      </div>

      {/* Gesture Packs & Accessible Phrase Board */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-base">Gesture Packs & Phrase Board</h3>
            <p className="text-xs text-muted">
              Import/export customized gesture profiles or open the touchless assistive communication board.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setGesturePacksOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-heading font-semibold bg-surface hover:bg-surface-secondary border border-border text-foreground transition-all shadow-soft"
          >
            Gesture Packs
          </button>
          <button
            onClick={() => setPhraseBoardOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-heading font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-card"
          >
            Open Phrase Board
          </button>
        </div>
      </div>

      {/* Advanced: Simulated Hand (Developer / Demo Mode) */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card shadow-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-foreground text-base">Simulated Hand</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-primary/10 text-primary border border-primary/20">
                Advanced / Demo
              </span>
            </div>
            <p className="text-xs text-muted max-w-xl mt-0.5">
              Feed synthetic 21-joint hand landmarks into the shared detection pipeline so every page, game, and gesture action works without a webcam.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !simulatedHand;
            setSimulatedHandState(next);
            masterGestureEngine.setSimulatedHand(next);
            flashSaved();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all shadow-soft ${simulatedHand
            ? 'bg-primary text-white shadow-card'
            : 'bg-surface hover:bg-surface-secondary border border-border text-muted'
            }`}
        >
          {simulatedHand ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <GesturePacksModal
        isOpen={gesturePacksOpen}
        onClose={() => setGesturePacksOpen(false)}
        onPacksImported={() => {
          setMapping(actionDispatcher.getMapping());
          flashSaved();
        }}
      />
      <PhraseBoardModal
        isOpen={phraseBoardOpen}
        onClose={() => setPhraseBoardOpen(false)}
      />
    </div>
  );
};
export default Settings;
