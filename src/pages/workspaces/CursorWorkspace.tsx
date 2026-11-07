import React, { useState, useRef, useEffect } from 'react';
import { MousePointer, Target, RotateCcw, Crosshair } from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';
import { useAccessibility } from '../../context/AccessibilityContext';
import confetti from 'canvas-confetti';

interface TargetBubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  hit: boolean;
}

export const CursorWorkspace: React.FC = () => {
  const { settings } = useAccessibility();
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [targets, setTargets] = useState<TargetBubble[]>([
    { id: 1, x: 25, y: 30, radius: 36, color: '#22D3EE', hit: false },
    { id: 2, x: 75, y: 35, radius: 40, color: '#8B5CF6', hit: false },
    { id: 3, x: 45, y: 65, radius: 44, color: '#38BDF8', hit: false },
    { id: 4, x: 80, y: 75, radius: 32, color: '#A855F7', hit: false },
  ]);
  const [score, setScore] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Dwell click state
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 1
  const dwellAnchorPos = useRef<{ x: number; y: number } | null>(null);
  const dwellStartTime = useRef<number | null>(null);

  const padRef = useRef<HTMLDivElement | null>(null);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 1800);
  };

  const handlePointerMove = (deltaX: number, deltaY: number) => {
    setPointerPos((prev) => {
      const nextX = Math.max(5, Math.min(95, prev.x + deltaX));
      const nextY = Math.max(5, Math.min(95, prev.y + deltaY));
      return { x: nextX, y: nextY };
    });
  };

  const handleClickTarget = () => {
    let scored = false;
    setTargets((prev) =>
      prev.map((t) => {
        if (t.hit) return t;
        const dist = Math.hypot(t.x - pointerPos.x, t.y - pointerPos.y);
        if (dist <= 14) {
          scored = true;
          return { ...t, hit: true };
        }
        return t;
      })
    );

    if (scored) {
      setScore((s) => s + 100);
      confetti({ particleCount: 40, spread: 60, origin: { x: pointerPos.x / 100, y: pointerPos.y / 100 } });
      triggerNotice('Target Struck! (+100 PTS)');
    } else {
      triggerNotice('Virtual Click Fired');
    }
  };

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

      const dist = Math.hypot(pointerPos.x - dwellAnchorPos.current.x, pointerPos.y - dwellAnchorPos.current.y);

      if (dist > 3.0) {
        // Pointer moved significantly, reset dwell anchor
        dwellAnchorPos.current = { ...pointerPos };
        dwellStartTime.current = now;
        setDwellProgress(0);
      } else {
        const elapsed = now - (dwellStartTime.current ?? now);
        const progress = Math.min(elapsed / settings.dwellDurationMs, 1.0);
        setDwellProgress(progress);

        if (progress >= 1.0) {
          // Trigger dwell click!
          handleClickTarget();
          triggerNotice('Dwell Click Activated (1.5s Hold)');
          dwellStartTime.current = now + 400; // brief reset delay
          setDwellProgress(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [pointerPos, settings.dwellClick, settings.dwellDurationMs]);

  const resetGame = () => {
    setTargets([
      { id: 1, x: 20 + Math.random() * 20, y: 25 + Math.random() * 20, radius: 36, color: '#22D3EE', hit: false },
      { id: 2, x: 65 + Math.random() * 20, y: 25 + Math.random() * 20, radius: 40, color: '#8B5CF6', hit: false },
      { id: 3, x: 30 + Math.random() * 30, y: 60 + Math.random() * 20, radius: 44, color: '#38BDF8', hit: false },
      { id: 4, x: 70 + Math.random() * 15, y: 65 + Math.random() * 15, radius: 32, color: '#A855F7', hit: false },
    ]);
    triggerNotice('Board Reset');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Pointer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            <MousePointer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg">Virtual Pointer Pad</h2>
            <p className="text-xs text-slate-400">
              Pointing Up (Move Cursor) • {settings.dwellClick ? '1.5s Dwell Hold or Fist (Click)' : 'Closed Fist (Click)'} • Victory (Reset)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Score:</span>
            <span className="font-mono text-cyan-300 font-bold text-sm">{score}</span>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Targets
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
        className="relative aspect-video w-full rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl cursor-crosshair select-none bg-[#090D1A]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {actionNotice && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full glass-panel border border-cyan-400/60 text-cyan-300 text-xs font-mono shadow-glow-cyan">
            {actionNotice}
          </div>
        )}

        {/* Target Spheres */}
        {targets.map((t) => (
          <div
            key={t.id}
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.radius * 2}px`,
              height: `${t.radius * 2}px`,
              borderColor: t.hit ? '#334155' : t.color,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              t.hit
                ? 'opacity-20 scale-90 bg-slate-900 border-dashed'
                : 'bg-slate-950/70 shadow-glow-cyan/40 animate-pulse'
            }`}
          >
            {!t.hit ? (
              <Crosshair className="w-5 h-5 text-cyan-400" />
            ) : (
              <span className="text-[10px] font-mono text-slate-500">HIT</span>
            )}
          </div>
        ))}

        {/* Virtual Glowing Cursor with Dwell Ring */}
        <div
          style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 z-20"
        >
          {/* Circular SVG Progress Ring for Dwell Click */}
          {settings.dwellClick && dwellProgress > 0 && (
            <svg className="w-14 h-14 absolute -top-4 -left-4 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#8B5CF6"
                strokeWidth="4"
                fill="none"
                strokeDasharray="138.2"
                strokeDashoffset={138.2 * (1 - dwellProgress)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}

          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan flex items-center justify-center border-2 border-white">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Helper Footer */}
        <div className="absolute bottom-4 left-6 text-xs font-mono text-slate-400 flex items-center gap-3">
          <span>X: {pointerPos.x.toFixed(0)}%</span>
          <span>Y: {pointerPos.y.toFixed(0)}%</span>
          {settings.dwellClick && (
            <span className="text-violet-300 font-bold">• Dwell Click Active (Hold 1.5s)</span>
          )}
        </div>
      </div>

      <PipCamera
        onAction={(action) => {
          if (action === 'cursor_move') {
            handlePointerMove((Math.random() - 0.45) * 8, (Math.random() - 0.45) * 8);
          } else if (action === 'play') {
            handleClickTarget();
          } else if (action === 'screenshot') {
            resetGame();
          }
        }}
      />
    </div>
  );
};
