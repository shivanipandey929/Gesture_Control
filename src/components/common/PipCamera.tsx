import React, { useRef, useState } from 'react';
import { useGestureEngine } from '../../engine';
import { Video, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface PipCameraProps {
  onAction?: (action: string, gesture: string) => void;
}

export const PipCamera: React.FC<PipCameraProps> = ({ onAction }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  const { state } = useGestureEngine(videoRef, canvasRef, {
    drawSkeleton: showSkeleton,
    onAction,
  });

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {/* Active Gesture Pill */}
      {state.hasHand && (
        <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-glow-cyan/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{state.filteredGesture.replace('_', ' ')}</span>
          <span className="text-[10px] text-slate-400">({(state.confidence * 100).toFixed(0)}%)</span>
        </div>
      )}

      {/* PiP Card */}
      <div className="glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 w-64 sm:w-72 bg-[#0B1020]/95">
        <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-heading font-semibold text-white">Live Tracking</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Toggle Skeleton Canvas"
            >
              {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title={minimized ? 'Expand Camera' : 'Minimize Camera'}
            >
              {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="relative aspect-video w-full bg-slate-950">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />
            {state.isCameraDenied && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-2 text-center text-[11px] text-rose-400 bg-slate-950/90">
                Camera permission denied
              </div>
            )}
            {!state.hasHand && !state.isCameraDenied && !state.isModelLoading && (
              <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-slate-400 font-mono">
                Raise hand to control
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

