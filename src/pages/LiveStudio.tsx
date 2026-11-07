import React, { useRef, useState } from 'react';
import { useGestureEngine } from '../engine';
import {
  CameraOff,
  Eye,
  EyeOff,
  Zap,
  Gauge,
  Moon,
  Sun,
  RotateCcw,
  Sparkles,
  Activity,
  Lock,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveStudio: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  const { state, retryCamera } = useGestureEngine(videoRef, canvasRef, {
    drawSkeleton: showSkeleton,
    onAction: (action, gesture) => {
      console.log(`Action dispatched: ${action} from ${gesture}`);
    },
  });

  const getGestureColor = (name: string) => {
    switch (name) {
      case 'Closed_Fist':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
      case 'Open_Palm':
        return 'text-rose-400 border-rose-500/30 bg-rose-950/40';
      case 'Pointing_Up':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';
      case 'Victory':
        return 'text-violet-400 border-violet-500/30 bg-violet-950/40';
      case 'Thumb_Up':
      case 'Thumb_Down':
        return 'text-amber-400 border-amber-500/30 bg-amber-950/40';
      case 'Swipe_Left':
      case 'Swipe_Right':
        return 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40';
      default:
        return 'text-slate-400 border-slate-700/50 bg-slate-900/40';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Studio Header & Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Gesture Live Studio
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Real-time offline hand recognition with sub-millisecond skeleton estimation
          </p>
        </div>

        {/* Live HUD Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FPS Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>{state.fps} FPS</span>
          </div>

          {/* Lighting State */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${state.isLowLight
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
          >
            {state.isLowLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Low Light ({state.brightness})</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Good Light ({state.brightness})</span>
              </>
            )}
          </div>

          {/* Tab Pause State */}
          {state.isTabHidden && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-600/50 text-xs font-mono text-indigo-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Tab Hidden (Detection Paused)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport & Studio Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Camera & Canvas Viewport */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-2xl group">
            {/* Underlying Video Feed (mirrored) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter brightness-105"
            />

            {/* Overlay Skeleton Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Model Loading Screen */}
            <AnimatePresence>
              {state.isModelLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-[#0B1020]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[2px] animate-spin">
                    <div className="w-full h-full bg-[#0B1020] rounded-[14px] flex items-center justify-center">
                      <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-white mb-1">
                      Initializing Offline Vision AI
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Loading local WebAssembly runtime and MediaPipe gesture model. Zero CDN calls.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Permission Denied / Error Screen */}
            <AnimatePresence>
              {state.isCameraDenied && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-[#0B1020]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center shadow-lg">
                    <CameraOff className="w-8 h-8 text-rose-400" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-heading text-xl font-bold text-white mb-2">
                      Camera Access Needed
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Please allow webcam access in your browser to enable live hand tracking. Your video feed is processed 100% locally on your device and never uploaded.
                    </p>
                    <button
                      onClick={retryCamera}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-sm font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 hover:opacity-90 transition-all shadow-glow-cyan"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry Camera Access
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No Hand Detected Banner */}
            {!state.isModelLoading && !state.isCameraDenied && !state.hasHand && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="px-4 py-2 rounded-full glass-panel border border-slate-700/80 bg-slate-900/80 text-xs text-slate-300 flex items-center gap-2 shadow-lg"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Raise your hand in front of the camera</span>
                </motion.div>
              </div>
            )}

            {/* Low Light Warning Notification */}
            {state.isLowLight && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-xs text-amber-200 flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Low ambient light detected. Brighter lighting improves tracking accuracy.</span>
                </div>
              </div>
            )}

            {/* Active Gesture Overlay Pill */}
            {state.hasHand && (
              <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
                <div className={`px-4 py-2 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-3 ${getGestureColor(state.filteredGesture)}`}>
                  <Sparkles className="w-4 h-4" />
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                      Confirmed Gesture
                    </div>
                    <div className="text-sm font-heading font-bold">
                      {state.filteredGesture.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-right pl-2 border-l border-white/20">
                    <div className="text-[10px] font-mono opacity-80">Confidence</div>
                    <div className="text-xs font-mono font-bold">
                      {(state.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Stability Progress Bar */}
                {state.stabilityProgress > 0 && state.stabilityProgress < 1 && (
                  <div className="w-36 h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-75"
                      style={{ width: `${state.stabilityProgress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Viewport Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl glass-panel">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showSkeleton
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
              >
                {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                21-Landmark Skeleton
              </button>

              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showDebug
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Engine Diagnostics
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Offline MediaPipe WASM Engine Active</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Engine Debug Panel & Action Mapping */}
        <div className="flex flex-col gap-4">
          {/* Engine Diagnostics Panel */}
          {showDebug && (
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-heading font-semibold text-white text-sm">
                    Engine Diagnostics
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  Step 2 Filtered
                </span>
              </div>

              {/* Raw vs Filtered Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Raw Detected</div>
                  <div className="font-heading font-bold text-sm text-slate-200 truncate">
                    {state.rawGesture.replace('_', ' ')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-800/40 shadow-glow-cyan/20">
                  <div className="text-[11px] text-cyan-400 mb-1">Filtered (Stable)</div>
                  <div className="font-heading font-bold text-sm text-cyan-300 truncate">
                    {state.filteredGesture.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Engine Metrics */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span className="text-cyan-400 font-bold">
                    {(state.confidence * 100).toFixed(1)}% (Threshold: 70%)
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Cooldown Status:</span>
                  <span className={state.inCooldown ? 'text-amber-400' : 'text-emerald-400'}>
                    {state.inCooldown ? 'Cooling down (600ms)' : 'Ready for trigger'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Wrist Velocity (vx, vy):</span>
                  <span className="text-violet-300">
                    {state.wristVelocity.vx.toFixed(2)}, {state.wristVelocity.vy.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Smoothing Filter:</span>
                  <span className="text-slate-200">One-Euro Adaptive (21 pts)</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Last Action Fired:</span>
                  <span className="text-cyan-300 font-bold uppercase">
                    {state.lastAction || 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Default Gesture Map Quick Reference */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-violet-400" />
              <h3 className="font-heading font-semibold text-white text-sm">
                Default Action Mapping
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { gesture: 'Open Palm', action: 'Pause', desc: 'Hold open palm' },
                { gesture: 'Closed Fist', action: 'Play', desc: 'Clench fist' },
                { gesture: 'Swipe Right', action: 'Next', desc: 'Flick hand right' },
                { gesture: 'Swipe Left', action: 'Previous', desc: 'Flick hand left' },
                { gesture: 'Thumb Up', action: 'Volume Up', desc: 'Raise thumb up' },
                { gesture: 'Thumb Down', action: 'Volume Down', desc: 'Point thumb down' },
                { gesture: 'Pointing Up', action: 'Virtual Cursor', desc: 'Point index finger' },
                { gesture: 'Victory (✌)', action: 'Screenshot', desc: 'Two fingers up' },
              ].map((item) => (
                <div
                  key={item.gesture}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80"
                >
                  <span className="font-medium text-slate-300">{item.gesture}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/50">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

