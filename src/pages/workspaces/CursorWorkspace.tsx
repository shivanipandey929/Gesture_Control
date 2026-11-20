import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MousePointer, Target, RotateCcw, Crosshair, Sparkles } from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useGesture } from '../../context/GestureContext';
import confetti from 'canvas-confetti';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface TargetBubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  hit: boolean;
}

export const CursorWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { settings } = useAccessibility();
  const { subscribe, setActiveMode } = useGesture();

  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [targets, setTargets] = useState<TargetBubble[]>([
    { id: 1, x: 25, y: 30, radius: 36, color: '#22D3EE', hit: false },
    { id: 2, x: 75, y: 35, radius: 40, color: '#8B5CF6', hit: false },
    { id: 3, x: 45, y: 65, radius: 44, color: '#38BDF8', hit: false },
    { id: 4, x: 80, y: 75, radius: 32, color: '#A855F7', hit: false },
  ]);
  const [score, setScore] = useState(0);

  // Dwell click state
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 1
  const dwellAnchorPos = useRef<{ x: number; y: number } | null>(null);
  const dwellStartTime = useRef<number | null>(null);

  const padRef = useRef<HTMLDivElement | null>(null);

  const handleClickTarget = useCallback(() => {
    let scored = false;
    setTargets((prev) =>
      prev.map((t) => {
        if (t.hit) return t;
        const dist = Math.hypot(t.x - pointerPos.x, t.y - pointerPos.y);
        if (dist <= 15) {
          scored = true;
          return { ...t, hit: true };
        }
        return t;
      })
    );

    if (scored) {
      setScore((s) => s + 100);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: pointerPos.x / 100, y: pointerPos.y / 100 },
      });
    }
  }, [pointerPos.x, pointerPos.y]);

  const resetGame = useCallback(() => {
    setTargets([
      { id: 1, x: 20 + Math.random() * 20, y: 25 + Math.random() * 20, radius: 36, color: '#22D3EE', hit: false },
      { id: 2, x: 65 + Math.random() * 20, y: 25 + Math.random() * 20, radius: 40, color: '#8B5CF6', hit: false },
      { id: 3, x: 30 + Math.random() * 30, y: 60 + Math.random() * 20, radius: 44, color: '#38BDF8', hit: false },
      { id: 4, x: 70 + Math.random() * 15, y: 65 + Math.random() * 15, radius: 32, color: '#A855F7', hit: false },
    ]);
  }, []);

  // Subscribe to gesture actions
  useEffect(() => {
    setActiveMode('cursor');
    const unsubscribe = subscribe(({ action }) => {
      if (action === 'CLICK') {
        handleClickTarget();
      } else if (action === 'SCREENSHOT') {
        resetGame();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, setActiveMode, handleClickTarget, resetGame]);

  // Handle hand landmark updates: Track index fingertip (landmark 8)
  const handleLandmarks = useCallback((landmarks: NormalizedLandmark[]) => {
    if (landmarks && landmarks.length > 8) {
      const indexTip = landmarks[8];
      // Mirrored horizontal coordinates
      const targetX = (1 - indexTip.x) * 100;
      const targetY = indexTip.y * 100;

      // Smooth interpolation
      setPointerPos((prev) => ({
        x: prev.x + (targetX - prev.x) * 0.4,
        y: prev.y + (targetY - prev.y) * 0.4,
      }));
    }
  }, []);

  // Keyboard navigation fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setPointerPos((p) => ({ ...p, x: Math.min(95, p.x + 4) }));
      } else if (e.key === 'ArrowLeft') {
        setPointerPos((p) => ({ ...p, x: Math.max(5, p.x - 4) }));
      } else if (e.key === 'ArrowUp') {
        setPointerPos((p) => ({ ...p, y: Math.max(5, p.y - 4) }));
      } else if (e.key === 'ArrowDown') {
        setPointerPos((p) => ({ ...p, y: Math.min(95, p.y + 4) }));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClickTarget();
      } else if (e.key.toLowerCase() === 'r') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClickTarget, resetGame]);

  // Dwell Click detection loop (1.5 seconds)
  useEffect(() => {
    if (!settings.dwellClick) {
      setDwellProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (!dwellAnchorPos.current) {
        dwellAnchorPos.current = { ...pointerPos };
        dwellStartTime.current = now;
        return;
      }

      const dist = Math.hypot(
        pointerPos.x - dwellAnchorPos.current.x,
        pointerPos.y - dwellAnchorPos.current.y
      );

      if (dist > 3.5) {
        dwellAnchorPos.current = { ...pointerPos };
        dwellStartTime.current = now;
        setDwellProgress(0);
      } else {
        const elapsed = now - (dwellStartTime.current ?? now);
        const progress = Math.min(elapsed / (settings.dwellDurationMs || 1500), 1.0);
        setDwellProgress(progress);

        if (progress >= 1.0) {
          handleClickTarget();
          dwellStartTime.current = now + 500;
          setDwellProgress(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [pointerPos, settings.dwellClick, settings.dwellDurationMs, handleClickTarget]);

  return (
    <div className="flex flex-col gap-6">
      {/* Pointer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <MousePointer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-foreground text-lg">{t('modes.cursor', 'Virtual Pointer Pad')}</h2>
            <p className="text-xs text-muted">
              {t('cursorWorkspace.desc', 'Calibrate fingertip coordinate mapping and test 1.5s dwell auto-clicking precision.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border shadow-soft">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted">{t('practice.score', 'Score')}:</span>
            <span className="font-mono text-primary font-bold text-sm">{score}</span>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-secondary text-xs font-semibold transition-colors shadow-soft"
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            <span>{t('cursorWorkspace.resetTargets', 'Reset Targets')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Virtual Canvas Area */}
      <div
        ref={padRef}
        onClick={(e) => {
          if (!padRef.current) return;
          const rect = padRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setPointerPos({ x, y });
          handleClickTarget();
        }}
        className="relative aspect-video w-full rounded-3xl overflow-hidden panel-card shadow-card cursor-crosshair select-none bg-surface-secondary"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

        {/* Target Spheres */}
        {targets.map((t) => (
          <div
            key={t.id}
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.radius * 2}px`,
              height: `${t.radius * 2}px`,
              borderColor: t.hit ? 'var(--border)' : 'var(--primary)',
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${t.hit
              ? 'opacity-20 scale-90 bg-surface border-dashed'
              : 'bg-surface shadow-card animate-pulse'
              }`}
          >
            {!t.hit ? (
              <Crosshair className="w-5 h-5 text-primary" />
            ) : (
              <span className="text-[10px] font-mono text-muted">HIT</span>
            )}
          </div>
        ))}

        {/* Virtual Glowing Cursor with Dwell Ring */}
        <div
          style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 z-20"
        >
          {settings.dwellClick && dwellProgress > 0 && (
            <svg className="w-14 h-14 absolute -top-4 -left-4 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                className="text-primary/20"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray="138.2"
                strokeDashoffset={138.2 * (1 - dwellProgress)}
                strokeLinecap="round"
                className="text-primary transition-all duration-75"
              />
            </svg>
          )}

          <div className="w-6 h-6 rounded-full bg-primary shadow-card flex items-center justify-center border-2 border-white">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Helper Footer */}
        <div className="absolute bottom-4 left-6 text-xs font-mono text-muted flex items-center gap-3">
          <span>X: {pointerPos.x.toFixed(0)}%</span>
          <span>Y: {pointerPos.y.toFixed(0)}%</span>
          {settings.dwellClick && (
            <span className="text-primary font-bold">• 1.5s Dwell Ring Active</span>
          )}
        </div>
      </div>

      {/* Gesture Guide Card */}
      <div className="p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-2 mb-3 text-xs font-heading font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t('cursorWorkspace.badge', 'Cursor Gesture Guide')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.pointingUp', 'Pointing Up')} ☝️</div>
            <div className="text-muted text-[11px]">{t('gestures.pointingUpAction', 'Direct index finger cursor')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('cursorWorkspace.holdStill', 'Hold Still 1.5s ⏱️')}</div>
            <div className="text-muted text-[11px]">{t('settings.dwellClick', 'Dwell auto-click')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.closedFist', 'Closed Fist')} ✊</div>
            <div className="text-muted text-[11px]">{t('cursorWorkspace.instantClick', 'Instant left click')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.victory', 'Victory')} ✌</div>
            <div className="text-muted text-[11px]">{t('cursorWorkspace.resetGameTargets', 'Reset game targets')}</div>
          </div>
        </div>
      </div>

      <PipCamera onLandmarks={handleLandmarks} />
    </div>
  );
};
