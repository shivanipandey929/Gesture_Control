import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Presentation } from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';

export const PresentationWorkspace: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const slides = [
    {
      title: 'Touchless Interaction: The AI Paradigm',
      subtitle: 'Controlling computing without mechanical peripherals',
      badge: 'Overview',
      content:
        'With neural vision networks running locally in WebAssembly, ordinary webcams deliver natural, zero-latency spatial input for modern applications.',
      gradient: 'from-cyan-900/40 to-slate-900/40',
      accent: 'text-cyan-400',
    },
    {
      title: 'Sub-Millisecond 1€ Filter Smoothing',
      subtitle: 'Eliminating micro-tremors without introducing lag',
      badge: 'Architecture',
      content:
        'The One-Euro filter dynamically adapts its cutoff frequency based on fingertip velocity, granting stable cursor hold and instantaneous high-speed flick recognition.',
      gradient: 'from-violet-900/40 to-slate-900/40',
      accent: 'text-violet-400',
    },
    {
      title: 'Zero-Cloud Absolute Data Privacy',
      subtitle: 'Your camera feed never touches an external server',
      badge: 'Security',
      content:
        'All landmark coordinates and gesture classifications are computed entirely on-chip inside the browser sandbox. Fully operational offline in airplane mode.',
      gradient: 'from-emerald-900/40 to-slate-900/40',
      accent: 'text-emerald-400',
    },
    {
      title: 'The Future of Spatial Web Interfaces',
      subtitle: 'Next-generation multimodal applications',
      badge: 'Roadmap',
      content:
        'Explore hands-free digital surgery assistants, smart kitchen recipe navigators, kiosks, and cleanroom computing powered by AeroTouch.',
      gradient: 'from-sky-900/40 to-slate-900/40',
      accent: 'text-sky-400',
    },
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    triggerNotice('Next Slide (Swipe Right)');
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    triggerNotice('Previous Slide (Swipe Left)');
  };

  const togglePlay = (playState?: boolean) => {
    const nextState = playState !== undefined ? playState : !isPlaying;
    setIsPlaying(nextState);
    triggerNotice(nextState ? 'Slideshow Playing (Closed Fist)' : 'Slideshow Paused (Open Palm)');
  };

  const triggerNotice = (text: string) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 2000);
  };

  // Autoplay timer
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Slide Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg">Presentation Deck</h2>
            <p className="text-xs text-slate-400">
              Slide {currentSlide + 1} of {slides.length} • Swipe Right / Left to switch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => togglePlay()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-heading transition-colors ${
              isPlaying
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Autoplay' : 'Play Autoplay'}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Canvas Viewer */}
      <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden glass-panel border border-slate-800 flex flex-col justify-between p-8 sm:p-14 shadow-2xl">
        {/* Background glow matching slide theme */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient} opacity-50`} />

        {/* Action Notice Overlay */}
        {actionNotice && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full glass-panel border border-cyan-400/50 text-cyan-300 text-xs font-mono shadow-glow-cyan animate-pulse">
            {actionNotice}
          </div>
        )}

        {/* Slide Top Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="font-mono text-xs uppercase px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
            {slides[currentSlide].badge}
          </span>
          <span className="font-mono text-xs text-slate-400">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Main Slide Content */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-300 mb-6">
            {slides[currentSlide].subtitle}
          </p>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            {slides[currentSlide].content}
          </p>
        </div>

        {/* Slide Footer Indicators */}
        <div className="relative z-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === i ? 'w-8 bg-cyan-400 shadow-glow-cyan' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Embedded Gesture Controller & PiP Camera */}
      <PipCamera
        onAction={(action) => {
          if (action === 'next') handleNext();
          else if (action === 'previous') handlePrev();
          else if (action === 'play') togglePlay(true);
          else if (action === 'pause') togglePlay(false);
        }}
      />
    </div>
  );
};

