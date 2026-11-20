import React from 'react';
import { Zap, Clock } from 'lucide-react';
import type { GestureEventRecord } from '../../db/db';

interface RecentActionsTableProps {
  recentActions: GestureEventRecord[];
  formatTime: (ts: number) => string;
}

export const RecentActionsTable: React.FC<RecentActionsTableProps> = ({
  recentActions,
  formatTime,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_15px_35px_rgba(29,99,232,0.06)] flex flex-col justify-between">
      {/* Table Header Strip */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-blue-900/30">
        <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
          <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#1D63E8] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span>Recent Fired Actions</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
          Real Events (IndexedDB)
        </span>
      </div>

      {recentActions.length === 0 ? (
        <div className="text-center py-10 space-y-2 text-muted">
          <Clock className="w-8 h-8 text-primary/40 mx-auto" />
          <p className="text-xs font-mono font-medium">No gestures yet. Start the camera and try one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs font-body">
            <thead>
              <tr className="border-b border-slate-100 dark:border-blue-900/40 text-[11px] font-heading font-semibold text-slate-500 dark:text-slate-400">
                <th className="pb-2.5 font-semibold">Time</th>
                <th className="pb-2.5 font-semibold">Gesture</th>
                <th className="pb-2.5 font-semibold">Action Fired</th>
                <th className="pb-2.5 font-semibold">Workspace</th>
                <th className="pb-2.5 text-right font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/20 font-mono">
              {recentActions.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className="hover:bg-slate-50/70 dark:hover:bg-card/40 transition-colors duration-150"
                >
                  <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    {formatTime(item.timestamp)}
                  </td>
                  <td className="py-2.5 font-heading font-bold text-foreground text-xs">
                    {item.gesture.replace('_', ' ')}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[#1D63E8] dark:text-sky-300 font-bold text-[10px] tracking-wide uppercase">
                      {item.action}
                    </span>
                  </td>
                  <td className="py-2.5 capitalize text-slate-600 dark:text-slate-300 text-[11px] font-heading font-medium">
                    {item.mode || 'Kitchen'}
                  </td>
                  <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-black text-xs">
                    {(item.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
