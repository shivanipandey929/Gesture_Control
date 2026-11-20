import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ArcadeTab } from './PracticeTypes';

interface PracticeGameOverModalProps {
  isOpen: boolean;
  lives: number;
  activeTab: ArcadeTab;
  hardestGesture?: string;
  score: number;
  successfulHits: number;
  bestScore: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const PracticeGameOverModal: React.FC<PracticeGameOverModalProps> = ({
  isOpen,
  lives,
  activeTab,
  hardestGesture,
  score,
  successfulHits,
  bestScore,
  onPlayAgain,
  onExit,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-xs z-40 flex flex-col items-center justify-center p-6 text-center gap-4">
      <Trophy className="w-12 h-12 text-warning animate-bounce" />
      <div>
        <h2 className="font-heading text-2xl font-black text-foreground">
          {lives <= 0 ? t('practiceArena.outOfLives', 'Out of Lives!') : t('practiceArena.roundComplete', 'Round Complete!')}
        </h2>
        {activeTab === 'match' && hardestGesture && (
          <p className="text-xs text-muted mt-1">
            {t('practiceArena.hardestGesture', 'Hardest gesture for you:')} <strong className="text-foreground">{hardestGesture}</strong>
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <div className="p-3 rounded-xl bg-surface border border-border shadow-soft">
          <span className="text-[10px] uppercase font-bold text-muted">{t('practiceArena.finalScore', 'Final Score')}</span>
          <p className="font-mono text-xl font-black text-primary">{score}</p>
        </div>
        <div className="p-3 rounded-xl bg-surface border border-border shadow-soft">
          <span className="text-[10px] uppercase font-bold text-muted">{t('practiceArena.hits', 'Hits')}</span>
          <p className="font-mono text-xl font-black text-foreground">{successfulHits}</p>
        </div>
        <div className="p-3 rounded-xl bg-surface border border-border shadow-soft">
          <span className="text-[10px] uppercase font-bold text-muted">{t('practiceArena.best', 'Best')}</span>
          <p className="font-mono text-xl font-black text-emerald-500">{bestScore || score}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onPlayAgain}
          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-card flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('practiceArena.playAgain', 'Play Again')}</span>
        </button>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-surface border border-border text-foreground font-heading font-semibold text-xs"
        >
          {t('practiceArena.exitLobby', 'Exit to Lobby')}
        </button>
      </div>
    </div>
  );
};
