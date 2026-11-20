import React from 'react';
import { History, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GameRecord } from './PracticeTypes';

interface PracticeHistoryTableProps {
  history: GameRecord[];
  rulesCardOpen: boolean;
  setRulesCardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PracticeHistoryTable: React.FC<PracticeHistoryTableProps> = ({
  history,
  rulesCardOpen,
  setRulesCardOpen,
}) => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-3 xl:col-span-3 space-y-4">
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111C35] border border-blue-100/80 dark:border-blue-900/40 shadow-soft space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/30 pb-2.5">
          <div className="flex items-center gap-2 font-heading font-bold text-xs text-foreground">
            <History className="w-4 h-4 text-primary" />
            <span>{t('practiceArena.recentSessions', 'Recent Arcade Sessions')}</span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted">{t('practiceArena.noGamesLogged', 'No games logged yet. Play a round!')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="border-b border-border/60 text-muted font-heading font-semibold text-[10px]">
                  <th className="pb-1.5">{t('practiceArena.colTime', 'Time')}</th>
                  <th className="pb-1.5">{t('practiceArena.colGame', 'Game')}</th>
                  <th className="pb-1.5">{t('practiceArena.colScore', 'Score')}</th>
                  <th className="pb-1.5">{t('practiceArena.colAccuracy', 'Accuracy')}</th>
                  <th className="pb-1.5 text-right">{t('practiceArena.colResult', 'Result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-blue-950/40">
                {history.slice(0, 5).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-card/40">
                    <td className="py-2 text-foreground">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 capitalize text-primary font-bold">{rec.game}</td>
                    <td className="py-2 text-foreground font-black">{rec.score}</td>
                    <td className="py-2 text-muted">{rec.accuracy}%</td>
                    <td className="py-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rec.result === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                      >
                        {rec.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collapsible Rules & Tips Card in In-Game view */}
      <div className="rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100/80 dark:border-blue-900/40 shadow-soft overflow-hidden">
        <button
          onClick={() => setRulesCardOpen((r) => !r)}
          className="w-full px-4 py-3 bg-white dark:bg-card flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-heading font-bold text-xs text-foreground">
              {t('practiceArena.rulesProTips', 'Rules & Pro Tips')}
            </span>
          </div>
          {rulesCardOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
        </button>

        {rulesCardOpen && (
          <div className="p-4 pt-1 border-t border-slate-100 dark:border-blue-900/40 text-[11px] text-muted space-y-2 leading-relaxed">
            <p>
              <strong className="text-foreground">{t('practiceArena.hoverPinchRuleTitle', 'Hover or Pinch:')}</strong> {t('practiceArena.hoverPinchRuleDesc', 'Hovering for 300ms pops balloons automatically. Pinching gives instant pop reflex.')}
            </p>
            <p>
              <strong className="text-foreground">{t('practiceArena.pauseAnytimeTitle', 'Pause Anytime:')}</strong> {t('practiceArena.pauseAnytimeDesc', 'Hold an Open Palm steadily for 800ms to pause the game.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
