import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Video, Hand, Sparkles, Target } from 'lucide-react';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const tourSteps = [
    {
      num: 1,
      title: 'Welcome to AeroTouch',
      subtitle: 'On-Device Computer Vision',
      desc: 'AeroTouch turns your standard webcam into a high-precision spatial controller. MediaPipe Tasks Vision runs locally in your browser with zero video data sent over the internet.',
      icon: Video,
      tip: 'Raise your hand 1 to 2 feet from the camera in good lighting.',
    },
    {
      num: 2,
      title: 'Open Palm & Fist: Play & Pause',
      subtitle: 'Core State Gestures',
      desc: 'Holding an Open Palm (✋) pauses whatever is playing or moving. Clenching your hand into a Closed Fist (✊) immediately resumes or triggers play.',
      icon: Hand,
      tip: 'Hold the pose steady for 350ms to confirm the action.',
    },
    {
      num: 3,
      title: 'Directional Flick Swiping',
      subtitle: 'Velocity-Based Navigation',
      desc: 'Swiftly flicking your hand left or right detects wrist velocity, instantly navigating presentation slides, reading articles, or kitchen recipe steps.',
      icon: Sparkles,
      tip: 'Flicks trigger instantly with a brief cooldown lockout to prevent double triggers.',
    },
    {
      num: 4,
      title: 'Virtual Cursor & Dwell Clicking',
      subtitle: 'Touchless Pointer Control',
      desc: 'Pointing your index finger (☝️) tracks your fingertip 1:1 across the screen. In Virtual Pointer mode, holding still for 1.5 seconds automatically activates dwell click.',
      icon: Target,
      tip: 'You are now ready to control your computer hands-free!',
    },
  ];

  const current = tourSteps[step - 1];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < tourSteps.length) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl panel-card border border-border shadow-elevated flex flex-col gap-6 animate-scale-in">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${step === s ? 'w-8 bg-primary' : step > s ? 'w-4 bg-emerald-500' : 'w-4 bg-surface-secondary'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            aria-label="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Icon className="w-6 h-6" />
          </div>

          <div>
            <span className="font-mono text-[11px] text-primary uppercase tracking-widest">
              Step {current.num} of 4 • {current.subtitle}
            </span>
            <h2 className="font-heading font-bold text-xl text-foreground mt-1">{current.title}</h2>
          </div>

          <p className="text-xs sm:text-sm text-muted leading-relaxed">{current.desc}</p>

          <div className="p-3 rounded-xl bg-surface-secondary border border-border flex items-center gap-2 text-xs text-muted">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Tip:</strong> {current.tip}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-heading font-semibold transition-colors flex items-center gap-2 shadow-card"
          >
            {step === tourSteps.length ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
