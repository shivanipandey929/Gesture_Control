import React from 'react';
import { X, Printer, Hand, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureCheatSheetModal: React.FC<CheatSheetProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const gestures = [
    {
      name: t('gestures.openPalm', 'Open Palm'),
      emoji: '✋',
      action: t('gestures.openPalmAction', 'Pause / Stop'),
      description: 'Spread all 5 fingers flat facing the camera. Pauses videos, presentations, or timers.',
      tag: 'Global Pause',
    },
    {
      name: t('gestures.closedFist', 'Closed Fist'),
      emoji: '✊',
      action: t('gestures.closedFistAction', 'Play / Start'),
      description: 'Clench all fingers into a tight fist. Resumes media or confirms selection.',
      tag: 'Global Play',
    },
    {
      name: t('gestures.swipeRight', 'Swipe Right'),
      emoji: '👉',
      action: t('gestures.swipeRightAction', 'Next Slide / Forward'),
      description: 'Flick your wrist swiftly from left to right. Advances slides and pages.',
      tag: 'Flick Trigger',
    },
    {
      name: t('gestures.swipeLeft', 'Swipe Left'),
      emoji: '👈',
      action: t('gestures.swipeLeftAction', 'Previous Slide / Back'),
      description: 'Flick your wrist swiftly from right to left. Reverses slides or history.',
      tag: 'Flick Trigger',
    },
    {
      name: t('gestures.thumbUp', 'Thumb Up'),
      emoji: '👍',
      action: t('gestures.thumbUpAction', 'Volume Up / Scroll Up'),
      description: 'Point thumb upwards with other fingers clenched. Raises volume or scrolls up.',
      tag: 'Continuous',
    },
    {
      name: t('gestures.thumbDown', 'Thumb Down'),
      emoji: '👎',
      action: t('gestures.thumbDownAction', 'Volume Down / Scroll Down'),
      description: 'Point thumb downwards. Lowers audio volume or scrolls reading view.',
      tag: 'Continuous',
    },
    {
      name: t('gestures.pointingUp', 'Pointing Up'),
      emoji: '☝️',
      action: t('gestures.pointingUpAction', 'Move Pointer / Laser'),
      description: 'Extend your index finger. Controls virtual cursor or activates red laser pointer on slides.',
      tag: 'Spatial Pointer',
    },
    {
      name: t('gestures.victory', 'Victory'),
      emoji: '✌️',
      action: t('gestures.victoryAction', 'Screenshot / Snapshot'),
      description: 'Form a V-sign with index and middle fingers. Captures a viewport snapshot.',
      tag: 'Snapshot',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl w-full p-6 sm:p-8 rounded-2xl panel-card border border-border shadow-elevated flex flex-col gap-6 my-8 print:m-0 print:p-4 print:bg-white print:text-black print:border-none print:shadow-none animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary print:hidden">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground print:text-black">
                AeroTouch Quick Reference Cheat Sheet
              </h2>
              <p className="text-xs text-muted print:text-gray-600">
                On-Device Spatial Gesture Control • No Hardware Required
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-secondary text-foreground text-xs font-heading font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Cheat Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
              aria-label="Close Cheat Sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8 Gesture Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gestures.map((g) => (
            <div
              key={g.name}
              className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-soft print:bg-white print:border-gray-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-primary font-medium print:border-gray-300 print:text-gray-700">
                    {g.tag}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-foreground print:text-black">
                  {g.name}
                </h3>
                <div className="font-mono text-xs font-semibold text-primary mt-0.5 print:text-blue-700">
                  {g.action}
                </div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed print:text-gray-600">
                  {g.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Footer */}
        <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-muted leading-relaxed flex items-start gap-2.5 print:border-gray-300 print:text-gray-700">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5 print:hidden" />
          <div>
            <strong className="text-foreground print:text-black">Tracking Tip:</strong> Raise your hand 1 to 2 feet from the camera in good lighting. Swipes register immediately upon wrist velocity spikes; static poses lock after 350 ms hold with a 600 ms action lockout.
          </div>
        </div>
      </div>
    </div>
  );
};
