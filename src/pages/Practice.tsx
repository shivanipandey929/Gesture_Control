import React, { useState, useRef, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { PipCamera } from '../components/common/PipCamera';
import confetti from 'canvas-confetti';

interface Balloon {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  popped: boolean;
}

const BALLOON_COLORS = ['#22D3EE', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B', '#EC4899'];

export const Practice: React.FC = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying] = useState(true);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [pointerPos, setPointerPos] = useState({ x: 50, y: 50 });

  const frameIdRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);

  // Initialize and spawn balloons
  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      setBalloons((prev) => {
        if (prev.length >= 8) return prev;
        const newBalloon: Balloon = {
          id: nextIdRef.current++,
          x: 10 + Math.random() * 80,
          y: 105, // start slightly below canvas
          radius: 24 + Math.random() * 12,
          speed: 0.35 + Math.random() * 0.45,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          popped: false,
        };
        return [...prev, newBalloon];
      });
    }, 1100);

    return () => clearInterval(spawnInterval);
  }, [isPlaying]);

  // Balloon animation and collision loop
  useEffect(() => {
    if (!isPlaying) return;

    const updateLoop = () => {
      setBalloons((prev) => {
        return prev
          .map((b) => {
            if (b.popped) return b;
            const newY = b.y - b.speed;
            // Check collision with pointer
            const dist = Math.hypot(b.x - pointerPos.x, newY - pointerPos.y);
            if (dist <= 8) {
              // Pop!
              setScore((s) => {
                const nextScore = s + 50;
                setHighScore((hs) => Math.max(hs, nextScore));
                return nextScore;
              });
              confetti({
                particleCount: 25,
                spread: 45,
                origin: { x: b.x / 100, y: Math.max(0.1, newY / 100) },
              });
              return { ...b, popped: true };
            }
            return { ...b, y: newY };
          })
          .filter((b) => !b.popped && b.y > -15);
      });

      frameIdRef.current = requestAnimationFrame(updateLoop);
    };

    frameIdRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isPlaying, pointerPos]);

  const handlePointerNudge = (dx: number, dy: number) => {
    setPointerPos((p) => ({
      x: Math.max(5, Math.min(95, p.x + dx)),
      y: Math.max(5, Math.min(95, p.y + dy)),
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 mb-2">
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Skill Trainer</span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            Practice Arena: Balloon Popper
          </h1>
          <p className="text-slate-400 text-sm">
            Pop rising neon balloons using your index finger pointing gesture.
          </p>
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Score:</span>
              <span className="font-mono text-cyan-300 font-bold text-base">{score}</span>
            </div>
            <div className="text-xs text-slate-500 pl-2 border-l border-slate-700">
              Best: <span className="font-mono text-violet-300 font-bold">{highScore}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setScore(0);
              setBalloons([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setPointerPos({ x, y });
        }}
        className="relative aspect-video w-full rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl bg-[#070A14] select-none cursor-crosshair"
      >
        {/* Floating Balloons */}
        {balloons.map((b) => (
          <div
            key={b.id}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.radius * 2}px`,
              height: `${b.radius * 2.5}px`,
              backgroundColor: b.color + '33',
              borderColor: b.color,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-2 shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          >
            <div className="w-2 h-2 rounded-full bg-white opacity-70 absolute top-2 right-2" />
            <span className="text-[10px] font-mono font-bold text-white opacity-80">+50</span>
          </div>
        ))}

        {/* Pointer Crosshair */}
        <div
          style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
        >
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/20 shadow-glow-cyan animate-pulse flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Stage HUD Footer */}
        <div className="absolute bottom-4 left-6 text-xs font-mono text-slate-400 flex items-center gap-4">
          <span className="text-cyan-300">Pointing_Up Guides Needle</span>
          <span className="text-slate-500">• Hover over balloons to burst them</span>
        </div>
      </div>

      {/* Embedded PiP Camera */}
      <PipCamera
        onAction={(action) => {
          if (action === 'cursor_move') {
            handlePointerNudge((Math.random() - 0.48) * 10, (Math.random() - 0.48) * 10);
          }
        }}
      />
    </div>
  );
};
