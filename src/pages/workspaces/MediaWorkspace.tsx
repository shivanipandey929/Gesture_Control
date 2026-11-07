import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Camera, 
  Film, 
  Download
} from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';

export const MediaWorkspace: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const canvasPlayerRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2000);
  };

  const handlePlayPause = (forcePlay?: boolean) => {
    setIsPlaying((prev) => {
      const next = forcePlay !== undefined ? forcePlay : !prev;
      triggerNotice(next ? 'Playing (Closed Fist)' : 'Paused (Open Palm)');
      return next;
    });
  };

  const handleVolumeChange = (delta: number) => {
    setVolume((prev) => {
      const next = Math.max(0, Math.min(100, prev + delta));
      triggerNotice(`Volume ${next}% (${delta > 0 ? 'Thumb Up' : 'Thumb Down'})`);
      return next;
    });
  };

  const captureScreenshot = () => {
    if (!canvasPlayerRef.current) return;
    const url = canvasPlayerRef.current.toDataURL('image/png');
    setScreenshotUrl(url);
    triggerNotice('Screenshot Captured! (Victory ✌)');
  };

  // Synthesize an animated cyber-themed sci-fi media visualizer onto the canvas
  useEffect(() => {
    const canvas = canvasPlayerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localTime = timeRef.current;

    const render = () => {
      if (isPlaying) {
        localTime += 0.03;
        timeRef.current = localTime;
      }

      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw futuristic animated audio/video rings
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const bars = 48;
      const radius = 90 + Math.sin(localTime * 2) * 10;

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const barHeight = isPlaying
          ? (Math.sin(localTime * 4 + i * 0.5) * 0.5 + 0.5) * 60 * (volume / 100) + 10
          : 6;

        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + barHeight);
        const y2 = cy + Math.sin(angle) * (radius + barHeight);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, '#22D3EE');
        grad.addColorStop(1, '#8B5CF6');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center glowing core
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? '#22D3EE18' : '#33415518';
      ctx.fill();
      ctx.strokeStyle = isPlaying ? '#22D3EE' : '#64748B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Play / Pause center glyph
      ctx.fillStyle = isPlaying ? '#22D3EE' : '#94A3B8';
      if (isPlaying) {
        ctx.fillRect(cx - 10, cy - 12, 6, 24);
        ctx.fillRect(cx + 4, cy - 12, 6, 24);
      } else {
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 14);
        ctx.lineTo(cx + 14, cy);
        ctx.lineTo(cx - 8, cy + 14);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, volume]);

  return (
    <div className="flex flex-col gap-6">
      {/* Player Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-800 text-violet-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-lg">Synthesized Media Theater</h2>
            <p className="text-xs text-slate-400">
              Closed Fist (Play) • Open Palm (Pause) • Thumb Up/Down (Volume) • Victory (Screenshot)
            </p>
          </div>
        </div>

        {/* Volume & Screenshot Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4 text-cyan-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs text-cyan-300 w-8">{volume}%</span>
          </div>

          <button
            onClick={captureScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-950/60 border border-violet-700/60 text-xs font-semibold text-violet-300 hover:bg-violet-900/60 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Snapshot
          </button>
        </div>
      </div>

      {/* Main Video/Media Canvas Viewport */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
        <canvas
          ref={canvasPlayerRef}
          width={854}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Action HUD Toast */}
        {actionNotice && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full glass-panel border border-cyan-400/60 text-cyan-300 text-xs font-mono shadow-glow-cyan">
            {actionNotice}
          </div>
        )}

        {/* Bottom Media Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePlayPause()}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
            </button>
            <div className="text-xs">
              <div className="font-heading font-semibold text-white">Quantum Pulse Track 01</div>
              <div className="text-[11px] text-slate-400">AeroTouch Spatial Synthesizer</div>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-400">
            {isPlaying ? 'Streaming audio wave...' : 'Playback paused'}
          </div>
        </div>
      </div>

      {/* Screenshot Preview Card if taken */}
      {screenshotUrl && (
        <div className="p-4 rounded-2xl glass-panel border border-violet-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={screenshotUrl}
              alt="Screenshot"
              className="w-20 h-12 object-cover rounded-lg border border-slate-700"
            />
            <div>
              <div className="font-heading font-semibold text-white text-sm">
                Gesture Snapshot Ready
              </div>
              <div className="text-xs text-slate-400">Captured via Victory (✌) gesture</div>
            </div>
          </div>
          <a
            href={screenshotUrl}
            download="aerotouch-snapshot.png"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white font-heading text-xs font-bold hover:bg-violet-500"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </a>
        </div>
      )}

      {/* Embedded Gesture Controller & PiP Camera */}
      <PipCamera
        onAction={(action) => {
          if (action === 'play') handlePlayPause(true);
          else if (action === 'pause') handlePlayPause(false);
          else if (action === 'volume_up') handleVolumeChange(10);
          else if (action === 'volume_down') handleVolumeChange(-10);
          else if (action === 'screenshot') captureScreenshot();
        }}
      />
    </div>
  );
};

