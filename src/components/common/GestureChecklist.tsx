import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RotateCcw, Sparkles } from 'lucide-react';

interface GestureCheckItem {
  id: string;
  label: string;
  detectedName: string;
  hint: string;
  icon: string;
}

const CHECKLIST_ITEMS: GestureCheckItem[] = [
  { id: 'palm', label: 'Open palm', detectedName: 'Open_Palm', hint: 'Hold open hand facing camera (250 ms)', icon: '✋' },
  { id: 'fist', label: 'Closed fist', detectedName: 'Closed_Fist', hint: 'Clench fingers into a fist', icon: '✊' },
  { id: 'thumb-up', label: 'Thumb up', detectedName: 'Thumb_Up', hint: 'Give a clear thumbs-up', icon: '👍' },
  { id: 'thumb-down', label: 'Thumb down', detectedName: 'Thumb_Down', hint: 'Point thumb downward', icon: '👎' },
  { id: 'point', label: 'Point', detectedName: 'Pointing_Up', hint: 'Extend index finger upward', icon: '☝️' },
  { id: 'victory', label: 'Victory', detectedName: 'Victory', hint: 'Two fingers up in a V-sign', icon: '✌️' },
  { id: 'swipe-right', label: 'Swipe right', detectedName: 'Swipe_Right', hint: 'Sweep hand toward your right', icon: '👉' },
  { id: 'swipe-left', label: 'Swipe left', detectedName: 'Swipe_Left', hint: 'Sweep hand toward your left', icon: '👈' },
];

export const GestureChecklist: React.FC<{ activeGesture: string; className?: string }> = ({
  activeGesture,
  className = '',
}) => {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_gesture_check');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Check off gestures ONLY when real engine outputs it
  useEffect(() => {
    if (!activeGesture || activeGesture === 'None') return;

    const matchedItem = CHECKLIST_ITEMS.find((item) => item.detectedName === activeGesture);
    if (matchedItem && !completed[matchedItem.id]) {
      setCompleted((prev) => {
        const next = { ...prev, [matchedItem.id]: true };
        try {
          localStorage.setItem('aerotouch_gesture_check', JSON.stringify(next));
        } catch {
          // Ignored
        }
        return next;
      });
    }
  }, [activeGesture, completed]);

  const completedCount = CHECKLIST_ITEMS.filter((item) => completed[item.id]).length;
  const isAllComplete = completedCount === CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const handleReset = () => {
    setCompleted({});
    try {
      localStorage.removeItem('aerotouch_gesture_check');
    } catch {
      // Ignored
    }
  };

  return (
    <div className={`rounded-[24px] panel-card p-5 sm:p-6 space-y-4 border border-border/80 shadow-soft bg-surface select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">Interactive Gesture Check</h3>
            <p className="text-[11px] text-muted">Test all 8 real gestures live with your camera</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg border border-border hover:bg-surface-secondary text-muted hover:text-foreground text-xs transition-colors flex items-center gap-1"
          title="Reset checklist progress"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-medium">Reset</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted font-medium">Progress</span>
          <span className="font-bold text-foreground">
            {completedCount} of {CHECKLIST_ITEMS.length} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden border border-border/60">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${isAllComplete
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-primary to-sky-400'
              }`}
          />
        </div>
      </div>

      {/* 8-Gesture Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = Boolean(completed[item.id]);
          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all duration-150 flex items-start gap-3 ${isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-xs'
                  : 'bg-surface-secondary/70 border-border/80 text-foreground hover:border-primary/40'
                }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted/60" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="font-heading font-semibold text-xs text-foreground">
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-tight mt-0.5">
                  {item.hint}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GestureChecklist;
