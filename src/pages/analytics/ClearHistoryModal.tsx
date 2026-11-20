import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111C35] border border-slate-200 dark:border-blue-900/60 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.2)] space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-heading font-black text-base text-foreground">Clear Gesture History?</h3>
            <p className="text-xs text-muted">This will erase all recorded IndexedDB telemetry events.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Your measured analytics counters and charts will be reset to zero. This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-blue-900 bg-white dark:bg-card text-xs font-heading font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-heading font-bold shadow-soft flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
