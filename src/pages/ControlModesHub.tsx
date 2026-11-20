import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PresentationWorkspace } from './workspaces/PresentationWorkspace';
import { MediaWorkspace } from './workspaces/MediaWorkspace';
import { ScrollWorkspace } from './workspaces/ScrollWorkspace';
import { CursorWorkspace } from './workspaces/CursorWorkspace';
import { ModesHeroVisual } from '../components/modes/ModesHeroVisual';
import {
  PresentationIllustration,
  MediaIllustration,
  ReaderIllustration,
  PointerIllustration,
  KitchenIllustration,
  PracticeIllustration,
} from '../components/modes/WorkspaceIllustrations';
import {
  Presentation,
  Film,
  BookOpen,
  MousePointer,
  Utensils,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useGesture } from '../context/GestureContext';
import { useCamera } from '../context/CameraContext';

export const ControlModesHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setActiveMode } = useGesture();
  const { stopCamera } = useCamera();
  const [selectedWorkspace, setSelectedWorkspace] = useState<'presentation' | 'media' | 'scroll' | 'cursor' | null>(null);

  // Automatically stop camera when user navigates away from Modes Hub
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const modes = [
    {
      id: 'presentation' as const,
      name: t('modes.presentation', 'Presentation'),
      desc: t('modes.presentationDesc', 'Swipe left and right to navigate slides with touchless pause.'),
      icon: Presentation,
      badge: t('modesHub.badgePresentation', 'FLICK CONTROL'),
      iconBoxBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60',
      illustration: <PresentationIllustration />,
      action: () => {
        setActiveMode('presentation');
        setSelectedWorkspace('presentation');
      },
    },
    {
      id: 'media' as const,
      name: t('modes.media', 'Media Player'),
      desc: t('modes.mediaDesc', 'Play, pause, adjust volume, and capture snapshots with hand signs.'),
      icon: Film,
      badge: t('modesHub.badgeMedia', 'AUDIO / VIDEO'),
      iconBoxBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60',
      illustration: <MediaIllustration />,
      action: () => {
        setActiveMode('media');
        setSelectedWorkspace('media');
      },
    },
    {
      id: 'scroll' as const,
      name: t('modes.scroll', 'Smart Reader'),
      desc: t('modes.scrollDesc', 'Hands-free continuous auto-scrolling for articles and documents.'),
      icon: BookOpen,
      badge: t('modesHub.badgeScroll', 'AUTO SCROLL'),
      iconBoxBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
      illustration: <ReaderIllustration />,
      action: () => {
        setActiveMode('scroll');
        setSelectedWorkspace('scroll');
      },
    },
    {
      id: 'cursor' as const,
      name: t('modes.cursor', 'Virtual Pointer'),
      desc: t('modes.cursorDesc', 'Direct fingertip pointer tracking with 1.5s dwell auto-clicking.'),
      icon: MousePointer,
      badge: t('modesHub.badgeCursor', 'TARGET PRACTICE'),
      iconBoxBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
      illustration: <PointerIllustration />,
      action: () => {
        setActiveMode('cursor');
        setSelectedWorkspace('cursor');
      },
    },
    {
      id: 'kitchen' as const,
      name: t('modes.kitchen', 'Kitchen Assistant'),
      desc: t('modes.kitchenDesc', 'Follow recipes and control kitchen timers without touching dirty screens.'),
      icon: Utensils,
      badge: t('modesHub.badgeKitchen', 'CULINARY UX'),
      iconBoxBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60',
      illustration: <KitchenIllustration />,
      action: () => {
        setActiveMode('kitchen');
        navigate('/kitchen');
      },
    },
    {
      id: 'practice' as const,
      name: t('modes.practice', 'Skill Practice'),
      desc: t('modes.practiceDesc', 'Train your spatial precision with an interactive balloon popping game.'),
      icon: Gamepad2,
      badge: t('modesHub.badgePractice', 'GAMIFIED SKILL'),
      iconBoxBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60',
      illustration: <PracticeIllustration />,
      action: () => {
        setActiveMode('practice');
        navigate('/practice');
      },
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden font-body select-none">
      {/* 1. Subtle Animated Light Ambient Gradient & Wave Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F9FF] via-[#EDF5FE] to-[#E2EEFF] dark:from-[#080F1F] dark:via-[#0B1428] dark:to-[#111C35] -z-10 transition-colors duration-500" />

      {/* 2. Soft Ambient Radial Glows */}
      <div className="absolute top-0 right-1/4 w-[650px] h-[550px] rounded-full bg-blue-400/10 dark:bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-32 w-[550px] h-[550px] rounded-full bg-sky-300/15 dark:bg-blue-600/15 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[700px] h-[400px] rounded-full bg-primary/10 dark:bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      {/* 3. Layered Ambient Waves at Bottom */}
      <div className="absolute bottom-0 inset-x-0 h-40 sm:h-56 pointer-events-none -z-10 overflow-hidden opacity-60 dark:opacity-30">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 280"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M 0,160 C 320,110 560,220 880,170 C 1200,120 1340,210 1440,160 L 1440,280 L 0,280 Z"
            fill="url(#modesWaveGrad)"
          />
          <defs>
            <linearGradient id="modesWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8 relative z-10">
        {/* If a workspace is selected, show back button and active workspace view */}
        {selectedWorkspace ? (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedWorkspace(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-heading font-semibold text-foreground hover:bg-surface-secondary transition-all shadow-soft hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span>{t('modes.backToHub', 'Back to Modes Hub')}</span>
              </button>

              {/* Quick Switch Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-secondary border border-border">
                {(['presentation', 'media', 'scroll', 'cursor'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveMode(id);
                      setSelectedWorkspace(id);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-heading capitalize font-semibold transition-all ${selectedWorkspace === id
                      ? 'bg-primary text-white font-bold shadow-soft'
                      : 'text-muted hover:text-foreground'
                      }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {selectedWorkspace === 'presentation' && <PresentationWorkspace />}
            {selectedWorkspace === 'media' && <MediaWorkspace />}
            {selectedWorkspace === 'scroll' && <ScrollWorkspace />}
            {selectedWorkspace === 'cursor' && <CursorWorkspace />}
          </div>
        ) : (
          /* 6 Workspace Cards View */
          <div className="flex flex-col gap-8 sm:gap-10">
            {/* HERO SECTION: Title, Description + Holographic Pointing Hand Graphic */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-xl">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-semibold mb-3.5 shadow-xs">
                  <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('modesHub.title', 'Control Modes Hub')}</span>
                </div>

                {/* Heading */}
                <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight">
                  {t('modesHub.titlePrefix', 'Control')}{' '}
                  <span className="text-primary">{t('modesHub.titleSuffix', 'Modes Hub')}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-muted text-sm sm:text-base mt-2.5 leading-relaxed max-w-xl">
                  {t('modesHub.subtitle', 'Choose a dedicated touchless workspace tailored for your workflow.')}{' '}
                  {t('modesHub.poweredBy', 'Powered entirely by offline browser computer vision.')}
                </p>
              </div>

              {/* Holographic Hand Touching Ripple Water Target */}
              <div className="shrink-0 w-full md:w-auto flex items-center justify-center md:justify-end">
                <ModesHeroVisual className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px]" />
              </div>
            </div>

            {/* 6 WORKSPACE CARDS GRID (3x2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className="rounded-[28px] panel-card p-6 sm:p-7 flex flex-col justify-between gap-5 bg-white/95 dark:bg-card/90 backdrop-blur-xl border border-blue-100/80 dark:border-blue-900/40 shadow-[0_10px_30px_rgba(29,99,232,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(29,99,232,0.14)] hover:border-primary/50 transition-all duration-200 group relative overflow-hidden select-none"
                  >
                    {/* Top Row: Icon Container + Category Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-200 shadow-xs ${mode.iconBoxBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase bg-surface-secondary/80 border border-border text-muted">
                        {mode.badge}
                      </span>
                    </div>

                    {/* Middle Row: Title + Description on Left, Illustration on Right */}
                    <div className="flex items-start justify-between gap-3 min-h-[92px]">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h3 className="font-heading font-extrabold text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {mode.name}
                        </h3>
                        <p className="text-muted text-xs sm:text-[13px] leading-relaxed line-clamp-3">
                          {mode.desc}
                        </p>
                      </div>

                      {/* Vector Illustration */}
                      <div className="shrink-0 transition-transform group-hover:scale-105 duration-200">
                        {mode.illustration}
                      </div>
                    </div>

                    {/* Bottom Row: Prominent Open Workspace Button */}
                    <div className="pt-1">
                      <button
                        onClick={mode.action}
                        className="w-full py-3 px-5 rounded-2xl bg-[#1D63E8] hover:bg-[#1554C9] text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_8px_20px_-4px_rgba(29,99,232,0.4)] hover:-translate-y-0.5 group/btn"
                      >
                        <span>{t('modesHub.openWorkspace', 'Open Workspace')}</span>
                        <ArrowRight className="w-4 h-4 text-white transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlModesHub;
