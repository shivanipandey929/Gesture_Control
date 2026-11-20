import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  WifiOff,
  Presentation,
  Film,
  BookOpen,
  MousePointer,
  Utensils,
  Sparkles,
  Gamepad2,
  Layers,
} from 'lucide-react';

const CURRENT_YEAR = 2026;

export const Landing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Looped animated demo state (camera-free demo card on the right)
  const [activeSlide, setActiveSlide] = useState(0);
  const [demoGesture, setDemoGesture] = useState<'Swipe Right' | 'Open Palm' | 'Closed Fist'>('Swipe Right');

  const demoSlides = [
    { title: 'Project Roadmap 2026', subtitle: 'Edge spatial computing architecture' },
    { title: 'Global Scale Operations', subtitle: 'Zero-cloud local model deployment' },
    { title: 'AeroTouch Vision Engine', subtitle: 'Sub-frame 21-joint skeleton tracking' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % demoSlides.length;
        if (next === 1) setDemoGesture('Swipe Right');
        else if (next === 2) setDemoGesture('Open Palm');
        else setDemoGesture('Closed Fist');
        return next;
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [demoSlides.length]);

  const gestures = [
    { name: t('gestures.openPalm', 'Open Palm'), icon: '✋', action: t('gestures.openPalmAction', 'Pause / Stop') },
    { name: t('gestures.closedFist', 'Closed Fist'), icon: '✊', action: t('gestures.closedFistAction', 'Play / Start') },
    { name: t('gestures.swipeRight', 'Swipe Right'), icon: '👉', action: t('gestures.swipeRightAction', 'Next Slide / Forward') },
    { name: t('gestures.swipeLeft', 'Swipe Left'), icon: '👈', action: t('gestures.swipeLeftAction', 'Previous Slide / Back') },
    { name: t('gestures.thumbUp', 'Thumb Up'), icon: '👍', action: t('gestures.thumbUpAction', 'Volume Up / Scroll Up') },
    { name: t('gestures.thumbDown', 'Thumb Down'), icon: '👎', action: t('gestures.thumbDownAction', 'Volume Down / Scroll Down') },
    { name: t('gestures.pointingUp', 'Pointing Up'), icon: '☝️', action: t('gestures.pointingUpAction', 'Move Pointer / Laser') },
    { name: t('gestures.victory', 'Victory'), icon: '✌️', action: t('gestures.victoryAction', 'Screenshot / Snapshot') },
  ];

  const modes = [
    {
      id: 'presentation',
      title: t('modes.presentation', 'Presentation'),
      desc: t('modes.presentationDesc', 'Swipe left and right to navigate slides with touchless pause.'),
      icon: Presentation,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      path: '/modes',
    },
    {
      id: 'media',
      title: t('modes.media', 'Media Player'),
      desc: t('modes.mediaDesc', 'Play, pause, adjust volume, and capture snapshots with hand signs.'),
      icon: Film,
      bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      path: '/modes',
    },
    {
      id: 'scroll',
      title: t('modes.scroll', 'Smart Reader'),
      desc: t('modes.scrollDesc', 'Hands-free continuous auto-scrolling for articles and documents.'),
      icon: BookOpen,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      path: '/modes',
    },
    {
      id: 'cursor',
      title: t('modes.cursor', 'Virtual Pointer'),
      desc: t('modes.cursorDesc', 'Direct fingertip pointer tracking with 1.5s dwell auto-clicking.'),
      icon: MousePointer,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      path: '/modes',
    },
    {
      id: 'kitchen',
      title: t('modes.kitchen', 'Kitchen Assistant'),
      desc: t('modes.kitchenDesc', 'Follow recipes and control kitchen timers without touching dirty screens.'),
      icon: Utensils,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      path: '/kitchen',
    },
    {
      id: 'practice',
      title: t('modes.practice', 'Skill Practice'),
      desc: t('modes.practiceDesc', 'Train your spatial precision with an interactive balloon popping game.'),
      icon: Gamepad2,
      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      path: '/practice',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-[1200px] px-4 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headline, subtext, 2 buttons */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-heading font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('landing.badge', 'AI Touchless Gesture Controller')}</span>
          </div>

          <h1 className="text-foreground tracking-tight">
            {t('landing.heroTitle', 'Control your screen with')}{' '}
            <span className="text-primary">{t('landing.heroTitleHighlight', 'air gestures')}</span>
          </h1>

          <p className="text-muted text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t(
              'landing.heroSubtitle',
              'Turn any standard laptop camera or webcam into an AI-powered touchless controller. Zero cloud latency, 100% private in-browser vision.'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
            <button onClick={() => navigate('/studio')} className="btn-primary">
              <span>{t('landing.startFree', 'Start free')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button onClick={() => navigate('/modes')} className="btn-secondary">
              <Layers className="w-4 h-4 text-primary" />
              <span>{t('landing.seeModes', 'See modes')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Camera-Free Interactive Demo Card */}
        <div className="lg:col-span-5 w-full">
          <div className="p-5 rounded-[20px] panel-card shadow-card bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
              <span className="font-heading font-bold text-foreground flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('landing.liveSimulation', 'Live Gesture Simulation')}</span>
              </span>
              <span className="text-[11px] font-mono text-muted bg-surface-secondary px-2 py-0.5 rounded-md border border-border">
                {t('landing.cameraFreeDemo', 'Camera-free demo')}
              </span>
            </div>

            {/* Simulated Presentation Screen */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {t('presentationWorkspace.slide', 'Slide')} {activeSlide + 1} {t('presentationWorkspace.of', 'of')} 3
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">{t('landing.deckTitle', 'AeroTouch Deck')}</span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  {demoSlides[activeSlide].title}
                </h4>
                <p className="text-xs text-slate-300 mt-1">{demoSlides[activeSlide].subtitle}</p>
              </div>

              {/* Floating Trigger Badge */}
              <div className="self-end px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono font-medium flex items-center gap-1.5 text-cyan-300">
                <span>{t('landing.detected', 'Detected:')}</span>
                <span className="font-bold text-white">{demoGesture}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted">
              {t('landing.autoAdvancing', 'Auto-advancing presentation using AI air gestures.')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. SLIM TRUST STRIP */}
      <section className="w-full border-y border-border bg-surface-secondary/50 py-5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-heading font-semibold text-foreground">
            <Cpu className="w-4 h-4 text-primary shrink-0" />
            <span>{t('landing.trustLocal', 'Runs locally in your browser')}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-heading font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t('landing.trustVideo', 'Video never uploaded anywhere')}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-heading font-semibold text-foreground">
            <WifiOff className="w-4 h-4 text-accent shrink-0" />
            <span>{t('landing.trustOffline', 'Works offline after the first load')}</span>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="w-full max-w-[1200px] px-4 sm:px-6 py-16 sm:py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-foreground">{t('landing.howItWorksTitle', 'How it works')}</h2>
          <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
            {t('landing.howItWorksSubtitle', 'Get started in seconds without special hardware or drivers.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: t('landing.step1Title', 'Start your webcam'),
              desc: t('landing.step1Desc', 'Click start camera. Frames are processed directly in your browser with zero remote transmission.'),
            },
            {
              step: '02',
              title: t('landing.step2Title', 'Pose or swipe'),
              desc: t('landing.step2Desc', 'MediaPipe local AI tracks 21 hand joints at high FPS with smooth low-latency hand tracking.'),
            },
            {
              step: '03',
              title: t('landing.step3Title', 'Instant touchless control'),
              desc: t('landing.step3Desc', 'Flick slides, scroll documents, tweak volume, or pop balloons without touching your keyboard.'),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-[20px] panel-card bg-surface border border-border shadow-soft flex flex-col justify-between space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-heading font-bold text-primary text-sm">
                {item.step}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading font-bold text-foreground text-lg">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. GESTURE GRID */}
      <section className="w-full max-w-[1200px] px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-foreground">{t('landing.gesturesTitle', 'Natural hand gestures')}</h2>
          <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
            {t('landing.gesturesSubtitle', 'Intuitive gestures calibrated for zero accidental triggers.')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {gestures.map((g) => (
            <div
              key={g.name}
              className="p-4 rounded-[20px] panel-card bg-surface border border-border shadow-soft flex flex-col items-center text-center space-y-2 hover:border-primary/40 transition-colors"
            >
              <span className="text-3xl sm:text-4xl">{g.icon}</span>
              <h4 className="font-heading font-bold text-foreground text-sm">{g.name}</h4>
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {g.action}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MODES */}
      <section className="w-full max-w-[1200px] px-4 sm:px-6 py-16 sm:py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-foreground">{t('landing.tasksTitle', 'Built for every task')}</h2>
          <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
            {t('landing.tasksSubtitle', 'Dedicated workspace modes customized for productivity, media, and play.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                to={m.path}
                className="p-6 rounded-[20px] panel-card bg-surface border border-border shadow-soft flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${m.bg}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">{m.desc}</p>
                </div>

                <div className="text-xs font-heading font-semibold text-primary flex items-center gap-1 pt-2">
                  <span>{t('landing.openMode', 'Open mode')}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. CALL-TO-ACTION BANNER */}
      <section className="w-full max-w-[1200px] px-4 sm:px-6 py-12">
        <div className="p-8 sm:p-12 rounded-[24px] bg-gradient-to-r from-primary to-blue-700 text-white shadow-elevated text-center space-y-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-white">
              {t('landing.ctaTitle', 'Ready to experience touchless control?')}
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              {t('landing.ctaSubtitle', 'Open the studio in your browser right now. No extensions, no downloads, and no credit card required.')}
            </p>
            <div className="pt-3">
              <button
                onClick={() => navigate('/studio')}
                className="h-11 px-6 rounded-xl bg-white hover:bg-slate-100 text-primary font-heading font-bold text-sm shadow-card inline-flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                <span>{t('landing.ctaButton', 'Launch AeroTouch Studio')}</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SLIM FOOTER IN ONE ROW */}
      <footer className="w-full border-t border-border bg-surface py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2 font-heading font-bold text-foreground text-sm">
            <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-xs">
              A
            </div>
            <span>AeroTouch</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <Link to="/studio" className="hover:text-foreground transition-colors">
              {t('nav.studio', 'Studio')}
            </Link>
            <Link to="/modes" className="hover:text-foreground transition-colors">
              {t('nav.modes', 'Modes')}
            </Link>
            <Link to="/practice" className="hover:text-foreground transition-colors">
              {t('nav.practice', 'Practice')}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t('privacyPage.badge', 'Privacy')}
            </Link>
          </div>

          <div className="font-mono text-[11px]">
            &copy; {CURRENT_YEAR} {t('landing.copyright', 'AeroTouch. Local browser AI.')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
