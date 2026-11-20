import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface KitchenPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceStep: number;
  setPracticeStep: React.Dispatch<React.SetStateAction<number>>;
}

export const KitchenPracticeModal: React.FC<KitchenPracticeModalProps> = ({
  isOpen,
  onClose,
  practiceStep,
  setPracticeStep,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-elevated max-w-md w-full space-y-4 text-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold font-heading text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t('kitchenMode.practiceTitle', 'Hands-Free Quick Practice')}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2 space-y-2">
          <div className="text-4xl">
            {practiceStep === 0 && '👉'}
            {practiceStep === 1 && '👈'}
            {practiceStep === 2 && '✊'}
            {practiceStep === 3 && '✌️'}
            {practiceStep === 4 && '✋'}
          </div>
          <h3 className="font-heading font-black text-lg text-foreground">
            {practiceStep === 0 && t('kitchenMode.pStep0Title', '1. Swipe Right: Next Step')}
            {practiceStep === 1 && t('kitchenMode.pStep1Title', '2. Swipe Left: Previous Step')}
            {practiceStep === 2 && t('kitchenMode.pStep2Title', '3. Closed Fist: Start Step Timer')}
            {practiceStep === 3 && t('kitchenMode.pStep3Title', '4. Victory: Read Step Aloud')}
            {practiceStep === 4 && t('kitchenMode.pStep4Title', '5. Open Palm: Stop Alarm / Pause')}
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            {practiceStep === 0 && t('kitchenMode.pStep0Desc', 'Flick your hand from left to right across the camera to advance steps.')}
            {practiceStep === 1 && t('kitchenMode.pStep1Desc', 'Flick from right to left to return to the previous step.')}
            {practiceStep === 2 && t('kitchenMode.pStep2Desc', 'Make a firm fist to trigger cooking countdown timers.')}
            {practiceStep === 3 && t('kitchenMode.pStep3Desc', 'Show two fingers (peace/victory) to have the step read to you.')}
            {practiceStep === 4 && t('kitchenMode.pStep4Desc', 'Show an open hand toward the camera for 1 second to dismiss alarm.')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={() => setPracticeStep((s) => Math.max(0, s - 1))}
            disabled={practiceStep === 0}
            className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted disabled:opacity-30"
          >
            {t('kitchenMode.prev', 'Previous')}
          </button>

          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === practiceStep ? 'bg-primary' : 'bg-surface-secondary'}`}
              />
            ))}
          </div>

          {practiceStep < 4 ? (
            <button
              onClick={() => setPracticeStep((s) => s + 1)}
              className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold"
            >
              {t('kitchenMode.next', 'Next')}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold"
            >
              {t('kitchenMode.readyBtn', "I'm Ready!")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
