import React, { useState } from 'react';
import type { GestureEngineState } from '../../engine';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Gauge,
  Sliders,
  Sun,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface GestureTesterCardProps {
  state: GestureEngineState;
  sensitivity: 'relaxed' | 'normal' | 'strict';
  onSensitivityChange: (s: 'relaxed' | 'normal' | 'strict') => void;
  brightnessBoost: boolean;
  onToggleBrightnessBoost: () => void;
}

export const GestureTesterCard: React.FC<GestureTesterCardProps> = ({
  state,
  sensitivity,
  onSensitivityChange,
  brightnessBoost,
  onToggleBrightnessBoost,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const holdProgressPercent = Math.min(100, Math.round(state.stabilityProgress * 100));
  const swipeTravelPercent = Math.min(
    100,
    Math.round(
      (state.swipeTelemetry.currentTravelX /
        Math.max(0.01, state.swipeTelemetry.targetTravelX)) *
        100
    )
  );
  const swipeSpeedPercent = Math.min(
    100,
    Math.round(
      (state.swipeTelemetry.currentSpeed /
        Math.max(0.01, state.swipeTelemetry.targetSpeed)) *
        100
    )
  );

  return (
    <div className="rounded-[24px] panel-card bg-surface border border-border/80 shadow-soft overflow-hidden select-none transition-all">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-surface-secondary/60 hover:bg-surface-secondary/80 flex items-center justify-between text-xs font-heading font-bold text-foreground border-b border-border/80 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-heading font-bold text-sm text-foreground block">
              Gesture Tester &amp; Live Diagnostics
            </span>
            <span className="text-[11px] font-normal text-muted">
              Real-time classification confidence &amp; kinematics
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {state.fps} FPS
            </span>
            <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-surface-secondary text-muted font-medium border border-border">
              {state.frameProcessingTimeMs} ms latency
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-muted capitalize hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-surface border border-border">
            Sensitivity: <strong className="text-foreground">{sensitivity}</strong>
          </span>
          <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-muted">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 space-y-4 text-xs font-body">
          {/* Low FPS Warning */}
          {state.lowFpsWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong>Low FPS detected ({state.fps} FPS):</strong> For smoother detection, ensure good room lighting and check Settings to enable Low-end hardware optimizations.
              </div>
            </div>
          )}

          {/* Low Light Alert with Brightness Boost */}
          {state.isLowLight && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Low room lighting detected. Boost camera sensor exposure?</span>
              </div>
              <button
                type="button"
                onClick={onToggleBrightnessBoost}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] shrink-0 transition-colors shadow-xs"
              >
                {brightnessBoost ? 'Boost Active ✓' : 'Boost Brightness'}
              </button>
            </div>
          )}

          {/* Top 3 MediaPipe Categories Live */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Top 3 MediaPipe Categories
              </span>
              <span className="font-mono text-[10px]">Real-time vision probability scores</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {state.top3Categories && state.top3Categories.length > 0 ? (
                state.top3Categories.map((cat, idx) => {
                  const scorePercent = Math.round(cat.score * 100);
                  const isTopMatch = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        isTopMatch
                          ? 'bg-primary/5 border-primary/30 shadow-xs'
                          : 'bg-surface-secondary/70 border-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-semibold text-muted flex items-center gap-1.5">
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                              isTopMatch ? 'bg-primary text-white' : 'bg-surface text-muted border border-border'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[100px]">
                            {cat.categoryName.replace('_', ' ')}
                          </span>
                        </span>
                        <span className="font-mono font-bold text-foreground text-sm">
                          {scorePercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mt-1.5">
                        <div
                          style={{ width: `${scorePercent}%` }}
                          className={`h-full rounded-full transition-all duration-100 ${
                            isTopMatch ? 'bg-primary' : 'bg-primary/40'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 p-4 rounded-2xl bg-surface-secondary/60 border border-border text-center text-muted font-medium">
                  No active hand detected in camera frame
                </div>
              )}
            </div>
          </div>

          {/* Kinematics Telemetry Grid: Static Hold, Swipe Meter, Wave Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Static Hold Progress Card */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border/80 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Static Hold
                </span>
                <span className="font-mono text-muted text-[10px]">
                  {state.holdTimeHeldMs}/{state.holdRequiredMs} ms
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* SVG Progress Ring */}
                <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                  <svg className="w-11 h-11 transform -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-border/70"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeDasharray={113}
                      strokeDashoffset={113 - (113 * holdProgressPercent) / 100}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-75"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-mono text-[10px] font-bold text-foreground">
                    {holdProgressPercent}%
                  </span>
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  <div className="text-[10px] text-muted">Active Stable:</div>
                  <div className="font-heading font-bold text-xs text-foreground truncate">
                    {state.filteredGesture !== 'None' ? state.filteredGesture.replace('_', ' ') : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Swipe Meter Card */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border/80 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-500" /> Swipe Meter
                </span>
                <span className="font-mono text-muted text-[10px]">
                  {state.swipeTelemetry.extendedFingers}/3 fingers
                </span>
              </div>

              {/* Travel Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Travel ({state.swipeTelemetry.targetTravelX.toFixed(2)})</span>
                  <span className="font-semibold text-foreground">{state.swipeTelemetry.currentTravelX.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    style={{ width: `${swipeTravelPercent}%` }}
                    className="h-full bg-sky-500 rounded-full transition-all duration-75"
                  />
                </div>
              </div>

              {/* Speed Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Speed ({state.swipeTelemetry.targetSpeed.toFixed(2)}/s)</span>
                  <span className="font-semibold text-foreground">{state.swipeTelemetry.currentSpeed.toFixed(2)}/s</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    style={{ width: `${swipeSpeedPercent}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                  />
                </div>
              </div>
            </div>

            {/* 3. Wave Meter Card */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border/80 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Wave Meter
                </span>
                <span className="font-mono text-muted text-[10px]">
                  {state.waveTelemetry?.reversalsCount || 0}/3 reversals
                </span>
              </div>

              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-[10px] text-muted font-mono">
                  <span>Swing Width (min {(state.waveTelemetry?.targetSwingWidth || 0.06).toFixed(2)})</span>
                  <span className="font-semibold text-foreground">{(state.waveTelemetry?.currentSwingWidth || 0).toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((state.waveTelemetry?.currentSwingWidth || 0) / 0.12) * 100)
                      )}%`,
                    }}
                    className="h-full bg-primary rounded-full transition-all duration-75"
                  />
                </div>
              </div>

              <div className="text-[10px] text-muted font-mono flex items-center justify-between pt-1 border-t border-border/50">
                <span>Wave trigger state:</span>
                <span className="font-semibold text-foreground">
                  {(state.waveTelemetry?.reversalsCount || 0) >= 3 ? 'Dispatched' : 'Listening'}
                </span>
              </div>
            </div>
          </div>

          {/* Status / Why Not Fired Line with Live Diagnostic Reason */}
          <div className="p-3.5 rounded-2xl bg-surface-secondary/90 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-[11px]">Status / Why not fired:</span>
              <span className="text-muted font-mono text-[11px] bg-surface px-2.5 py-0.5 rounded-md border border-border/80">
                {state.whyNotFired}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold border transition-colors ${
                  state.inCooldown
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
              >
                {state.inCooldown ? '● Cooldown Active' : '● Ready'}
              </span>
            </div>
          </div>

          {/* Sensitivity Threshold Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-border text-[11px]">
            <div className="flex items-center gap-2 text-muted">
              <Sliders className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Sensitivity Thresholds:</span>
              <span className="text-muted text-[10px]">(Hold time &amp; confidence tolerance)</span>
            </div>

            <div className="flex items-center gap-1 bg-surface-secondary border border-border p-1 rounded-xl font-heading font-semibold self-start sm:self-auto">
              {(['relaxed', 'normal', 'strict'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSensitivityChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    sensitivity === s
                      ? 'bg-surface text-primary shadow-soft font-bold border border-border'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureTesterCard;
