import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ArrowDown, ArrowUp, Pause, Play } from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';

export const ScrollWorkspace: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const scrollSpeed = 1.5;

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2000);
  };

  const handleScroll = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  const toggleAutoScroll = (force?: boolean) => {
    setIsAutoScrolling((prev) => {
      const next = force !== undefined ? force : !prev;
      triggerNotice(next ? 'Auto-Scrolling (Pointing Up)' : 'Scroll Paused (Open Palm)');
      return next;
    });
  };

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
          scrollContainerRef.current.scrollTop = 0; // loop back
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg">Long-form Reader</h2>
            <p className="text-xs text-slate-400">
              Pointing Up (Scroll Down) • Open Palm (Halt) • Swipe (Jump Sections)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAutoScroll()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-colors ${
              isAutoScrolling
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoScrolling ? 'Halt Scrolling' : 'Start Auto-Scroll'}
          </button>

          <button
            onClick={() => handleScroll(-280)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Scroll Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll(280)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Scroll Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reader Container */}
      <div className="relative glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden h-[540px]">
        {/* Action Notice overlay */}
        {actionNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full glass-panel border border-cyan-400/60 text-cyan-300 text-xs font-mono shadow-glow-cyan">
            {actionNotice}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-6 sm:p-12 space-y-8 scroll-smooth text-slate-300 leading-relaxed font-body"
        >
          <div className="border-b border-slate-800 pb-6">
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">
              Whitepaper Article • Hands-Free UX
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white mt-2 mb-3">
              Spatial Computing and Touchless Human-Computer Interfaces
            </h1>
            <p className="text-slate-400 text-sm">
              Published by AeroTouch Research • Estimated reading time: 6 min
            </p>
          </div>

          <section id="section-1" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-white text-cyan-300">
              1. Introduction to WebAssembly Vision Pipelines
            </h2>
            <p>
              Traditional computer vision historically relied upon thick native binaries or distant cloud servers to perform inference. Transmitting high-definition video frames to the cloud, however, incurs massive bandwidth overheads and inherently compromises user privacy.
            </p>
            <p>
              By leveraging Google MediaPipe compiled into WebAssembly and SIMD-accelerated instructions, modern web applications can process 30 to 60 camera frames per second directly inside client CPU and GPU hardware.
            </p>
          </section>

          <section id="section-2" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-white text-violet-300">
              2. Temporal Landmark Smoothing with the 1€ Filter
            </h2>
            <p>
              Raw landmark coordinates from monocular RGB cameras suffer from high-frequency micro-jitter caused by sensor thermal noise and slight hand tremor. Traditional Butterworth or low-pass filters introduce objectionable lag, making interaction feel sluggish.
            </p>
            <p>
              The One-Euro filter solves this dilemma through an adaptive cutoff frequency. When the user holds their hand static, the cutoff lowers dramatically to eliminate jitter. When the user flicks their hand to trigger a swipe, the cutoff spikes to zero latency.
            </p>
          </section>

          <section id="section-3" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-white text-emerald-300">
              3. Dynamic Velocity Swiping vs Static Pose Classification
            </h2>
            <p>
              Gestures are either static poses or dynamic trajectories. While static poses like a closed fist or thumbs up map cleanly to continuous binary states (play/pause), discrete navigation actions (like flipping a presentation slide or advancing a document) benefit immensely from velocity-based directional flicks.
            </p>
            <p>
              By tracking the normalized first-derivative of the wrist coordinate over a 280ms sliding window, the gesture engine discriminates intentional flick motions from inadvertent hand repositioning.
            </p>
          </section>

          <section id="section-4" className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-white text-cyan-300">
              4. Environmental Resilience and Low-Light Adaptation
            </h2>
            <p>
              Ambient illuminance dramatically impacts landmark detection thresholds. Real-time luminance sampling monitors frame brightness and immediately signals assistive cues to the user when lighting conditions drop below operational thresholds.
            </p>
          </section>
        </div>
      </div>

      {/* Embedded Gesture Controller & PiP Camera */}
      <PipCamera
        onAction={(action) => {
          if (action === 'cursor_move') toggleAutoScroll(true);
          else if (action === 'pause') toggleAutoScroll(false);
          else if (action === 'next') handleScroll(300);
          else if (action === 'previous') handleScroll(-300);
        }}
      />
    </div>
  );
};

