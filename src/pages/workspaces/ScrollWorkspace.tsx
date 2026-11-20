import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ArrowDown, ArrowUp, Pause, Play, Sparkles } from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';
import { useGesture } from '../../context/GestureContext';

export const ScrollWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollSpeed = 1.5;
  const { subscribe, setActiveMode } = useGesture();

  const handleScroll = useCallback((amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  }, []);

  const toggleAutoScroll = useCallback((force?: boolean) => {
    setIsAutoScrolling((prev) => (force !== undefined ? force : !prev));
  }, []);

  // Gesture subscription
  useEffect(() => {
    setActiveMode('scroll');
    const unsubscribe = subscribe(({ action }) => {
      if (action === 'SCROLL_DOWN') {
        handleScroll(260);
      } else if (action === 'SCROLL_UP') {
        handleScroll(-260);
      } else if (action === 'PAUSE') {
        setIsAutoScrolling(false);
      } else if (action === 'PLAY') {
        setIsAutoScrolling(true);
      } else if (action === 'NEXT') {
        handleScroll(450);
      } else if (action === 'PREV') {
        handleScroll(-450);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, setActiveMode, handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleScroll(260);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handleScroll(-260);
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoScroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll, toggleAutoScroll]);

  // Continuous auto-scroll loop
  useEffect(() => {
    if (!isAutoScrolling) return;

    let frameId: number;
    const scrollStep = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed;
        if (
          scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
          scrollContainerRef.current.scrollHeight
        ) {
          scrollContainerRef.current.scrollTop = 0; // loop back to top
        }
      }
      frameId = requestAnimationFrame(scrollStep);
    };

    frameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoScrolling, scrollSpeed]);

  return (
    <div className="flex flex-col gap-6">
      {/* Scroll Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-foreground text-lg">{t('modes.scroll', 'Long-form Reader')}</h2>
            <p className="text-xs text-muted">
              {t('scrollWorkspace.desc', 'Hands-free continuous auto-scrolling for articles and documents.')}
            </p>
          </div>
        </div>

        {/* Fallback On-Screen Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAutoScroll()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors shadow-soft ${isAutoScrolling
              ? 'bg-error/10 text-error border border-error/30'
              : 'bg-primary/10 text-primary border border-primary/30'
              }`}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoScrolling ? t('scrollWorkspace.paused', 'Halt Auto-Scroll') : t('scrollWorkspace.scrolling', 'Auto-Scroll')}
          </button>

          <button
            onClick={() => handleScroll(-280)}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors shadow-soft"
            title="Scroll Up"
            aria-label="Scroll Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll(280)}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors shadow-soft"
            title="Scroll Down"
            aria-label="Scroll Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reader Container */}
      <div className="relative panel-card rounded-3xl shadow-card overflow-hidden h-[540px]">
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          className="h-full overflow-y-auto p-6 sm:p-12 space-y-8 scroll-smooth text-muted leading-relaxed font-body outline-none focus:ring-1 focus:ring-primary/40"
        >
          <div className="border-b border-border pb-6">
            <span className="font-mono text-xs text-primary uppercase tracking-widest font-semibold">
              {t('scrollWorkspace.tag', 'Whitepaper Article • Hands-Free UX')}
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-foreground mt-2 mb-3">
              {t('scrollWorkspace.heading', 'Spatial Computing and Touchless Human-Computer Interfaces')}
            </h1>
            <p className="text-muted text-sm">
              {t('scrollWorkspace.meta', 'Published by AeroTouch Research • Estimated reading time: 6 min')}
            </p>
          </div>

          <section id="section-1" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">
              {t('scrollWorkspace.sec1Title', '1. Introduction to WebAssembly Vision Pipelines')}
            </h2>
            <p>
              {t('scrollWorkspace.sec1P1', 'Traditional computer vision historically relied upon thick native binaries or distant cloud servers to perform inference. Transmitting high-definition video frames to the cloud, however, incurs massive bandwidth overheads and inherently compromises user privacy.')}
            </p>
            <p>
              {t('scrollWorkspace.sec1P2', 'By leveraging Google MediaPipe compiled into WebAssembly and SIMD-accelerated instructions, modern web applications can process camera frames directly inside client CPU and GPU hardware.')}
            </p>
          </section>

          <section id="section-2" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">
              {t('scrollWorkspace.sec2Title', '2. Temporal Landmark Smoothing with the 1€ Filter')}
            </h2>
            <p>
              {t('scrollWorkspace.sec2P1', 'Raw landmark coordinates from monocular RGB cameras suffer from high-frequency micro-jitter caused by sensor thermal noise and slight hand tremor. Traditional Butterworth or low-pass filters introduce objectionable lag, making interaction feel sluggish.')}
            </p>
            <p>
              {t('scrollWorkspace.sec2P2', 'The One-Euro filter solves this dilemma through an adaptive cutoff frequency. When the user holds their hand static, the cutoff lowers dramatically to eliminate jitter. When the user flicks their hand to trigger a swipe, the cutoff spikes to eliminate lag.')}
            </p>
          </section>

          <section id="section-3" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">
              {t('scrollWorkspace.sec3Title', '3. Dynamic Velocity Swiping vs Static Pose Classification')}
            </h2>
            <p>
              {t('scrollWorkspace.sec3P1', 'Gestures are either static poses or dynamic trajectories. While static poses like a closed fist or thumbs up map cleanly to continuous binary states (play/pause), discrete navigation actions (like flipping a presentation slide or advancing a document) benefit immensely from velocity-based directional flicks.')}
            </p>
            <p>
              {t('scrollWorkspace.sec3P2', 'By tracking the normalized first-derivative of the wrist coordinate over a 280ms sliding window, the gesture engine discriminates intentional flick motions from inadvertent hand repositioning.')}
            </p>
          </section>

          <section id="section-4" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">
              {t('scrollWorkspace.sec4Title', '4. Environmental Resilience and Low-Light Adaptation')}
            </h2>
            <p>
              {t('scrollWorkspace.sec4P1', 'Ambient illuminance dramatically impacts landmark detection thresholds. Real-time luminance sampling monitors frame brightness and immediately signals assistive cues to the user when lighting conditions drop below operational thresholds.')}
            </p>
          </section>
        </div>
      </div>

      {/* Gesture Guide Card */}
      <div className="p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-2 mb-3 text-xs font-heading font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t('scrollWorkspace.badge', 'Reader Gesture Guide')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.thumbUp', 'Thumb Up')} 👍</div>
            <div className="text-muted text-[11px]">{t('gestures.thumbUpAction', 'Scroll page up')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.thumbDown', 'Thumb Down')} 👎</div>
            <div className="text-muted text-[11px]">{t('gestures.thumbDownAction', 'Scroll page down')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.openPalm', 'Open Palm')} ✋</div>
            <div className="text-muted text-[11px]">{t('gestures.openPalmAction', 'Halt auto-scrolling')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.pointingUp', 'Pointing Up')} ☝️</div>
            <div className="text-muted text-[11px]">{t('gestures.pointingUpAction', 'Move Pointer')}</div>
          </div>
        </div>
      </div>

      <PipCamera />
    </div>
  );
};
