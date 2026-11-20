import React, { useState, useEffect } from 'react';
import { useCamera } from '../../context/CameraContext';
import { getMediaPipeStatus } from '../../services/mediapipe';
import { masterGestureEngine } from '../../engine';
import { Terminal, X, Shield, Cpu, Activity, AlertCircle, Hand } from 'lucide-react';

export const DevDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { diagnostics, isStreaming, loadingPhase, error, errorMessage } = useCamera();
  const [modelStatus, setModelStatus] = useState(getMediaPipeStatus());
  const [simulatedHand, setSimulatedHand] = useState(masterGestureEngine.isSimulatedHand);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setModelStatus(getMediaPipeStatus());
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ backgroundColor: 'rgba(8, 15, 31, 0.94)' }}
      className="fixed bottom-6 left-6 z-50 w-80 sm:w-96 p-4 rounded-2xl border border-cyan-500/40 text-cyan-50 shadow-2xl backdrop-blur-xl font-mono text-xs select-none space-y-3"
    >
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>AeroTouch Dev Inspector (Shift+D)</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-cyan-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-[11px]">
        {/* Camera State */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-cyan-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Camera Runtime
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isStreaming ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {isStreaming ? 'STREAMING' : 'OFFLINE'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 text-slate-300">
            <div>Phase: <span className="text-white">{loadingPhase}</span></div>
            <div>Permission: <span className="text-white">{diagnostics.permissionState}</span></div>
            <div>Res: <span className="text-white">{diagnostics.resolution.width}x{diagnostics.resolution.height}</span></div>
            <div>Device: <span className="text-white truncate block max-w-[120px]">{diagnostics.deviceName}</span></div>
          </div>
        </div>

        {/* Model State */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-cyan-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> MediaPipe Vision
            </span>
            <span className="text-emerald-400 text-[10px] font-bold">
              {modelStatus.delegate || (diagnostics.modelLoaded ? 'GPU' : 'LOADING')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 text-slate-300">
            <div>Model: <span className="text-white">gesture_recognizer.task</span></div>
            <div>WASM: <span className="text-white">/wasm internal</span></div>
          </div>
        </div>

        {/* Simulated Hand Developer Mode Toggle */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-cyan-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-cyan-400" /> Simulated Hand
            </span>
            <button
              onClick={() => {
                const next = !simulatedHand;
                setSimulatedHand(next);
                masterGestureEngine.setSimulatedHand(next);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                simulatedHand
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {simulatedHand ? 'ACTIVE (ON)' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Emulate synthetic 21-joint hand landmarks and test gestures without a webcam.
          </p>
        </div>

        {/* Real-Time Performance */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-cyan-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Real-time Metrics
            </span>
            <span className="text-cyan-400 font-bold">{diagnostics.fps} FPS</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 text-slate-300">
            <div>Inference: <span className="text-white">{diagnostics.inferenceMs} ms</span></div>
            <div>Hands: <span className="text-white">{diagnostics.handsDetected}</span></div>
            <div>Loop: <span className="text-emerald-400">Shared (320x240)</span></div>
            <div>Target: <span className="text-white">&ge; 24 FPS</span></div>
          </div>
        </div>

        {/* Error reporting if any */}
        {(error || modelStatus.error || errorMessage) && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" /> Last Error
            </div>
            <p className="text-[10px] leading-relaxed break-words">
              {errorMessage || modelStatus.error || error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
