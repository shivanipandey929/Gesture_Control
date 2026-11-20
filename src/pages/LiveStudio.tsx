import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGestureEngine } from '../engine';
import { useCamera } from '../context/CameraContext';
import { CameraConsentCard } from '../components/common/CameraConsentCard';
import { CameraStatusChip } from '../components/common/CameraStatusChip';
import { CameraDiagnosticsCard } from '../components/common/CameraDiagnosticsCard';
import { SnapshotsGalleryCard } from '../components/studio/SnapshotsGalleryCard';
import { captureSnapshot } from '../utils/snapshot';
import { GestureChecklist } from '../components/common/GestureChecklist';
import { GestureTesterCard } from '../components/common/GestureTesterCard';
import { GuidedTourModal } from '../components/common/GuidedTourModal';
import { ActivityFeed } from '../components/common/ActivityFeed';
import { useSpeechFeedback } from '../hooks/useSpeechFeedback';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { db } from '../db/db';
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Zap,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Award,
  HelpCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveStudio: React.FC = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tabs: 'control' | 'practice'
  const [activeTab, setActiveTab] = useState<'control' | 'practice'>('control');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  // Live Caption state
  const [liveCaption, setLiveCaption] = useState<string | null>(null);
  const captionTimerRef = useRef<number | null>(null);

  // Practice Mode target drill state
  const [targetGesture, setTargetGesture] = useState<string>('Open_Palm');
  const [practiceSuccess, setPracticeSuccess] = useState<boolean>(false);

  // Demo Mode state
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  const { isStreaming, startCamera, stopCamera } = useCamera();

  // Speech synthesis feedback hook
  const {
    voiceEnabled,
    setVoiceEnabled,
    voiceVolume,
    setVoiceVolume,
    activateVoiceOnCameraStart,
    speak,
  } = useSpeechFeedback();

  // Sensitivity state
  const [sensitivity, setSensitivityState] = useState<'relaxed' | 'normal' | 'strict'>(() => {
    return (localStorage.getItem('aerotouch_sensitivity') as 'relaxed' | 'normal' | 'strict') || 'relaxed';
  });

  // Format action text with direction arrows for swipes
  const getActionPhrase = (action: string, gesture: string): string => {
    const gestureFormatted = gesture.replace('_', ' ');
    switch (action) {
      case 'NEXT':
        return `${gestureFormatted} →: Next slide`;
      case 'PREV':
        return `${gestureFormatted} ←: Previous slide`;
      case 'PAUSE':
        return `${gestureFormatted}: Pause / Freeze`;
      case 'PLAY':
        return `${gestureFormatted}: Play / Resume`;
      case 'VOLUME_UP':
        return `${gestureFormatted} ↑: Volume up`;
      case 'VOLUME_DOWN':
        return `${gestureFormatted} ↓: Volume down`;
      case 'CLICK':
        return `${gestureFormatted}: Click`;
      case 'SCREENSHOT':
        return `${gestureFormatted}: Screenshot captured`;
      case 'SCROLL_UP':
        return `${gestureFormatted} ↑: Scroll up`;
      case 'SCROLL_DOWN':
        return `${gestureFormatted} ↓: Scroll down`;
      case 'HELLO':
        return 'Wave 👋: Hello';
      default:
        if (gesture === 'Wave') return 'Wave 👋: Hello';
        return `${gestureFormatted}: ${action.replace('_', ' ')}`;
    }
  };

  const triggerLiveCaption = (text: string) => {
    setLiveCaption(text);
    if (captionTimerRef.current) {
      window.clearTimeout(captionTimerRef.current);
    }
    captionTimerRef.current = window.setTimeout(() => {
      setLiveCaption(null);
    }, 1200);
  };

  // Main gesture engine
  const {
    state,
    retryModel,
    setSensitivity,
    brightnessBoost,
    toggleBrightnessBoost,
  } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: showSkeleton,
    sensitivity,
    onAction: (action, gesture) => {
      if (action === 'SCREENSHOT' || gesture === 'Victory') {
        captureSnapshot({ videoElement: videoRef.current }).then((res) => {
          if (res.success && res.filename) {
            triggerLiveCaption(`Saved: ${res.filename}`);
            speak(`Saved ${res.filename}`);
          } else {
            triggerLiveCaption(`Snapshot: ${res.error || 'Failed'}`);
          }
        });
        return;
      }

      const phrase = getActionPhrase(action, gesture);
      triggerLiveCaption(phrase);
      speak(phrase.split(': ')[1] || phrase);

      // Check practice target match
      if (activeTab === 'practice' && gesture === targetGesture) {
        setPracticeSuccess(true);
        setTimeout(() => {
          setPracticeSuccess(false);
          const gestureList = ['Open_Palm', 'Closed_Fist', 'Swipe_Right', 'Swipe_Left', 'Pointing_Up', 'Thumb_Up'];
          const nextIdx = (gestureList.indexOf(targetGesture) + 1) % gestureList.length;
          setTargetGesture(gestureList[nextIdx]);
        }, 1500);
      }
    },
  });

  const handleSensitivityChange = (newSens: 'relaxed' | 'normal' | 'strict') => {
    setSensitivityState(newSens);
    setSensitivity(newSens);
  };

  const handleStartCamera = () => {
    activateVoiceOnCameraStart();
    startCamera();
  };

  // Demo Mode: Auto-play scripted gesture sequence (swipe, fist, palm, thumb up)
  const runDemoMode = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);

    const sequence: { gesture: string; action: string; delay: number }[] = [
      { gesture: 'Swipe_Right', action: 'NEXT', delay: 400 },
      { gesture: 'Closed_Fist', action: 'PLAY', delay: 2000 },
      { gesture: 'Open_Palm', action: 'PAUSE', delay: 3600 },
      { gesture: 'Thumb_Up', action: 'VOLUME_UP', delay: 5200 },
    ];

    sequence.forEach(({ gesture, action, delay }) => {
      setTimeout(async () => {
        const phrase = getActionPhrase(action, gesture);
        triggerLiveCaption(phrase);
        speak(phrase.split(': ')[1] || phrase);

        try {
          await db.gestureEvents.add({
            gesture,
            action,
            confidence: 0.96,
            mode: 'demo',
            timestamp: Date.now(),
            synced: false,
          });
        } catch {
          // ignore
        }
      }, delay);
    });

    setTimeout(() => {
      setIsDemoRunning(false);
    }, 6500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto font-body select-none">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('liveStudio.title', 'Studio')}
            </h1>
            <CameraStatusChip
              hasHand={state.hasHand}
              isLowLight={state.isLowLight}
              modelError={state.modelError}
              onRetry={retryModel}
            />
          </div>
          <p className="text-muted text-xs sm:text-sm">
            {t('liveStudio.desc', 'Real-time vision tracking and gesture recognition engine.')}
          </p>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          {/* How It Works Button */}
          <button
            onClick={() => setTourOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border/80 text-foreground font-heading font-semibold text-xs transition-all duration-150 hover:-translate-y-0.5 shadow-soft"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>{t('liveStudio.howItWorks', 'How it works')}</span>
          </button>

          {/* Control / Practice Segmented Tabs */}
          <div className="flex p-1 rounded-xl bg-surface-secondary/80 border border-border/80 text-xs font-heading font-semibold">
            <button
              onClick={() => setActiveTab('control')}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 ${activeTab === 'control'
                ? 'bg-surface text-primary shadow-soft border border-border/80 font-bold'
                : 'text-muted hover:text-foreground'
                }`}
            >
              {t('liveStudio.controlTab', 'Control')}
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 ${activeTab === 'practice'
                ? 'bg-surface text-primary shadow-soft border border-border/80 font-bold'
                : 'text-muted hover:text-foreground'
                }`}
            >
              {t('liveStudio.practiceTab', 'Practice')}
            </button>
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={runDemoMode}
            disabled={isDemoRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border/80 text-foreground font-heading font-semibold text-xs transition-all duration-150 hover:-translate-y-0.5 shadow-soft disabled:opacity-50"
            title="Auto-play scripted gesture sequence for presentation"
          >
            <Play className={`w-3.5 h-3.5 text-primary ${isDemoRunning ? 'animate-spin' : ''}`} />
            <span>{isDemoRunning ? 'Simulating...' : t('liveStudio.demoMode', 'Demo Mode')}</span>
          </button>

          {/* Single Primary Start/Stop Camera Button */}
          <button
            onClick={isStreaming ? stopCamera : handleStartCamera}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all duration-150 shadow-[0_8px_20px_-4px_rgba(29,99,232,0.35)] hover:-translate-y-0.5 ${isStreaming
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#1D63E8] hover:bg-[#1554c9] text-white'
              }`}
          >
            {isStreaming ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span>{isStreaming ? t('liveStudio.stopCamera', 'Stop camera') : t('liveStudio.startCamera', 'Start camera')}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport Grid: Video/Canvas on Left (2 cols), Activity/Feed on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: STICKY below navbar (top: 96px) */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 flex flex-col gap-4 self-start">
          {/* Camera Frame: STRICT FIXED aspect-[4/3] ratio with reserved space */}
          <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden bg-surface-secondary/70 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_12px_40px_rgba(29,99,232,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
            {isStreaming ? (
              <>
                {/* Mirrored video feed with optional brightness boost */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${brightnessBoost ? 'filter brightness-125 contrast-110' : 'filter brightness-105'
                    }`}
                />

                {/* Skeleton & Glow Canvas */}
                <HandOverlayCanvas drawSkeleton={showSkeleton} />

                {/* Live Vision Status Pill (Top-Left) */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <div
                    style={{ backgroundColor: 'rgba(11, 18, 32, 0.75)' }}
                    className="px-3 py-1.5 rounded-full text-white text-xs flex items-center gap-2 shadow-md backdrop-blur-md border border-white/10 font-mono"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-[11px]">Live Vision</span>
                    <span className="text-white/60">·</span>
                    <span className="text-cyan-400 text-[11px] font-bold">{state.fps} FPS</span>
                  </div>
                </div>

                {/* Model Loading Screen */}
                <AnimatePresence>
                  {state.isModelLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-spin">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Loading Vision Pipeline
                        </h3>
                        <p className="text-xs text-muted max-w-sm mt-1">
                          Initializing local MediaPipe model in WebAssembly.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Model Error Overlay with Retry */}
                {state.modelError && (
                  <div className="absolute inset-0 z-30 bg-surface/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-error">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        Model Loading Failed
                      </h3>
                      <p className="text-xs text-muted max-w-sm mt-1">
                        {state.modelError}
                      </p>
                    </div>
                    <button
                      onClick={retryModel}
                      className="mt-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-card"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Loading</span>
                    </button>
                  </div>
                )}

                {/* Dark translucent pill hint when no hand detected */}
                {!state.isModelLoading && !state.modelError && !state.hasHand && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[90%]">
                    <div
                      style={{ backgroundColor: 'rgba(11, 18, 32, 0.75)' }}
                      className="px-4 py-2 rounded-full text-white text-xs sm:text-sm flex items-center gap-2 shadow-lg backdrop-blur-md border border-white/10"
                    >
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="font-medium">Raise your hand 1 to 2 feet from camera in good light</span>
                    </div>
                  </div>
                )}

                {/* Low Light Alert Banner in translucent dark pill */}
                {state.isLowLight && (
                  <div className="absolute top-4 right-4 z-20 pointer-events-none">
                    <div
                      style={{ backgroundColor: 'rgba(11, 18, 32, 0.75)' }}
                      className="px-3.5 py-1.5 rounded-full text-amber-300 text-xs flex items-center gap-2 shadow-md backdrop-blur-md border border-amber-500/30"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-medium">Low light</span>
                    </div>
                  </div>
                )}

                {/* LIVE CAPTION: Big rounded translucent dark pill bar at bottom of video for 1.2s */}
                <AnimatePresence>
                  {liveCaption && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[90%]"
                    >
                      <div
                        style={{ backgroundColor: 'rgba(11, 18, 32, 0.85)' }}
                        className="px-6 py-2.5 rounded-full text-white shadow-2xl backdrop-blur-md flex items-center gap-3 border border-white/15"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-heading font-bold text-base tracking-wide">
                          {liveCaption}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="p-6 w-full flex items-center justify-center relative">
                {/* Subtle Optical Radar Rings in Standby Mode */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-[380px] h-[380px] rounded-full border border-primary/20" />
                  <div className="w-[260px] h-[260px] rounded-full border border-primary/25" />
                  <div className="w-[140px] h-[140px] rounded-full border border-primary/30" />
                </div>
                {/* Viewfinder Corner Brackets */}
                <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-lg pointer-events-none" />

                <CameraConsentCard compact={false} />
              </div>
            )}
          </div>

          {/* Viewport Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border/80 shadow-soft text-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Skeleton Overlay Toggle */}
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-150 ${showSkeleton
                  ? 'bg-primary/10 text-primary border-primary/30 font-semibold shadow-xs'
                  : 'bg-surface-secondary text-muted border-border hover:text-foreground'
                  }`}
              >
                {showSkeleton ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{t('liveStudio.skeleton', 'Skeleton')}</span>
              </button>

              {/* Voice Feedback Toggle */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-150 ${voiceEnabled
                  ? 'bg-primary/10 text-primary border-primary/30 font-semibold shadow-xs'
                  : 'bg-surface-secondary text-muted border-border hover:text-foreground'
                  }`}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{t('liveStudio.voice', 'Voice')}: {voiceEnabled ? t('liveStudio.on', 'On') : t('liveStudio.off', 'Off')}</span>
              </button>

              {/* Voice Volume Slider */}
              {voiceEnabled && (
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                  <span className="text-[11px] text-muted">Vol</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={voiceVolume}
                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                    className="w-16 h-1.5 accent-primary bg-surface-secondary rounded-lg cursor-pointer"
                    aria-label="Voice feedback volume"
                  />
                </div>
              )}
            </div>

            {/* Offline Runtime Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-[11px] font-mono text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{t('liveStudio.runtimeActive', 'Offline WASM Runtime Active')}</span>
            </div>
          </div>

          {/* Practice Tab Challenge Banner */}
          {activeTab === 'practice' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-sky-500/5 to-primary/10 border border-primary/20 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono uppercase font-bold text-primary">Practice Target Drill</span>
                </div>
                <h3 className="font-heading font-extrabold text-foreground text-lg">
                  Perform: <span className="text-primary">{targetGesture.replace('_', ' ')}</span>
                </h3>
                <p className="text-xs text-muted">
                  Hold this gesture steady in front of the camera to complete the drill.
                </p>
              </div>

              {practiceSuccess && (
                <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-card animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Success! Next pose...</span>
                </div>
              )}
            </div>
          )}

          {/* GESTURE TESTER PANEL (Collapsible card, visible by default) */}
          <GestureTesterCard
            state={state}
            sensitivity={sensitivity}
            onSensitivityChange={handleSensitivityChange}
            brightnessBoost={brightnessBoost}
            onToggleBrightnessBoost={toggleBrightnessBoost}
          />

          {/* Gesture Checklist (8 gestures) */}
          <GestureChecklist
            activeGesture={state.filteredGesture !== 'None' ? state.filteredGesture : state.rawGesture}
          />

          {/* Snapshots Gallery Card (IndexedDB) */}
          <SnapshotsGalleryCard />

          {/* Collapsible Camera Diagnostics Card */}
          <CameraDiagnosticsCard />
        </div>

        {/* Right Column: Real-Time Activity Feed & {t('liveStudio.gestureGuide', 'Gesture Guide')} */}
        <div className="flex flex-col gap-6">
          {/* Chat-style Real-Time Activity Feed (IndexedDB) */}
          <div className="h-[380px]">
            <ActivityFeed maxItems={20} />
          </div>

          {/* Gesture Guide Card */}
          <div className="p-5 sm:p-6 rounded-[24px] panel-card bg-surface border border-border/80 shadow-soft space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {t('liveStudio.gestureGuide', 'Gesture Guide')}
                </h3>
                <p className="text-[11px] text-muted">{t('liveStudio.guideDesc', 'Core spatial poses mapped to actions')}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { icon: '✋', name: 'Open Palm', action: 'Pause / Freeze' },
                { icon: '✊', name: 'Closed Fist', action: 'Play / Resume' },
                { icon: '👉', name: 'Swipe Right', action: 'Next Slide' },
                { icon: '👈', name: 'Swipe Left', action: 'Previous Slide' },
                { icon: '👍', name: 'Thumb Up', action: 'Volume Up' },
                { icon: '👎', name: 'Thumb Down', action: 'Volume Down' },
                { icon: '☝️', name: 'Pointing Up', action: 'Virtual Pointer' },
                { icon: '✌️', name: 'Victory', action: 'Screenshot' },
              ].map((g) => (
                <div
                  key={g.name}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-secondary/70 hover:bg-surface-secondary border border-border/80 hover:border-primary/40 transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border/60">
                      {g.icon}
                    </span>
                    <span className="font-heading font-semibold text-foreground text-xs">{g.name}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    {g.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guided Tour Modal */}
      <GuidedTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
};

export default LiveStudio;
