import React from 'react';
import { useTranslation } from 'react-i18next';

interface PracticeRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PracticeRulesModal: React.FC<PracticeRulesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="p-6 rounded-3xl bg-white dark:bg-card border border-blue-200 dark:border-blue-900 shadow-elevated max-w-lg w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-foreground">
            {t('practiceArena.rulesModalTitle', 'How to Play & Pro Tips')}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 text-sm font-bold"
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-xs text-muted leading-relaxed">
          <p>
            <strong className="text-foreground">{t('practiceArena.balloonPop', 'Balloon Pop')}:</strong> {t('practiceArena.ruleBalloon', 'Hover pointer over a balloon for 300ms or pinch with index and thumb. Avoid red skull bombs!')}
          </p>
          <p>
            <strong className="text-foreground">{t('practiceArena.fruitSlash', 'Fruit Slash')}:</strong> {t('practiceArena.ruleFruit', 'Swipe your index finger swiftly across flying fruits to cut them before they fall.')}
          </p>
          <p>
            <strong className="text-foreground">{t('practiceArena.gestureMatch', 'Gesture Match')}:</strong> {t('practiceArena.ruleMatch', 'Match the displayed target gesture before the round countdown finishes.')}
          </p>
          <p>
            <strong className="text-foreground">{t('practiceArena.airDraw', 'Air Draw')}:</strong> {t('practiceArena.ruleDraw', 'Pinch to draw in 3D air. Lift your hand to stop drawing. Hold closed fist to erase.')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft"
        >
          {t('practiceArena.gotItPlay', "Got it, let's play!")}
        </button>
      </div>
    </div>
  );
};
