import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Compass, 
  ArrowRight, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useGestureEngine } from '../engine';
import confetti from 'canvas-confetti';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [calibrationCountdown, setCalibrationCountdown] = useState<number>(10);
  const [calibratedGestures, setCalibratedGestures] = useState<Record<string, boolean>>({
    Open_Palm: false,
    Closed_Fist: false,
    Pointing_Up: false,
    Victory: false,
  });

  const { state, retryCamera } = useGestureEngine(videoRef, canvasRef, {
    drawSkeleton: true,
  });

  // Track calibration in Step 3
  useEffect(() => {
    if (currentStep !== 3) return;

    if (state.filteredGesture && state.filteredGesture in calibratedGestures) {
      setCalibratedGestures((prev) => {
        if (!prev[state.filteredGesture]) {
          return { ...prev, [state.filteredGesture]: true };
        }
        return prev;
      });
    }
  }, [currentStep, state.filteredGesture, calibratedGestures]);

  // 10-second countdown in Step 3
  useEffect(() => {
    if (currentStep !== 3) return;

    const timer = setInterval(() => {
      setCalibrationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
      {/* Stepper Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/60 text-xs font-mono text-violet-300 mb-3">
          <Compass className="w-3.5 h-3.5 text-violet-400" />
          <span>Interactive Setup & Calibration</span>
        </div>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-2">
          Ready Your Gesture Studio
        </h1>
        <p className="text-slate-400 text-sm">
          Follow 3 quick steps to verify camera feed, lighting clarity, and practice key gestures.
        </p>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
          {[
            { num: 1, title: 'Camera' },
            { num: 2, title: 'Lighting' },
            { num: 3, title: '10s Calibration' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-heading font-semibold transition-all ${
                currentStep === s.num
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-glow-cyan/20'
                  : currentStep > s.num
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === s.num
                    ? 'bg-cyan-400 text-slate-950'
                    : currentStep > s.num
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        {/* Left: Live Video Preview */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
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

          {/* Fallback messages inside preview */}
          {state.isCameraDenied && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-8 h-8 text-rose-400 mb-2" />
              <div className="text-white font-heading font-bold text-sm mb-1">
                Camera Blocked
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Click allow on your browser's address bar to enable camera.
              </p>
              <button
                onClick={retryCamera}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold font-heading"
              >
                Retry
              </button>
            </div>
          )}

          {state.hasHand && (
            <div className="absolute bottom-3 right-3 z-20 px-3 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              Detected: {state.filteredGesture.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Right: Step Interactive Content */}
        <div className="flex flex-col gap-6">
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-cyan-400 font-heading font-semibold text-lg">
                <Camera className="w-5 h-5" />
                Step 1: Grant Webcam Permission
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                AeroTouch runs exclusively inside your browser sandbox. We do not transmit video frames over the internet.
              </p>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Camera Status:</span>
                  <span className={state.isCameraDenied ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {state.isCameraDenied ? 'Access Denied' : 'Connected & Streaming'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Engine WASM:</span>
                  <span className="text-cyan-400 font-bold">
                    {state.isModelLoading ? 'Loading Model...' : 'Ready (Offline)'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={state.isCameraDenied}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-sm hover:from-cyan-300 hover:to-cyan-200 transition-all disabled:opacity-50"
              >
                Proceed to Lighting Check
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-amber-400 font-heading font-semibold text-lg">
                <Sun className="w-5 h-5" />
                Step 2: Lighting & Environment Check
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Optical hand tracking relies on good ambient lighting. Check your luminance score below.
              </p>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Ambient Brightness:</span>
                  <span className="text-cyan-400 font-bold">{state.brightness} / 255</span>
                </div>

                {/* Brightness bar */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      state.isLowLight ? 'bg-amber-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min((state.brightness / 200) * 100, 100)}%` }}
                  />
                </div>

                <div className="text-xs">
                  {state.isLowLight ? (
                    <div className="text-amber-400 flex items-center gap-1.5">
                      <Moon className="w-4 h-4" />
                      Low light warning! Please turn on a light source for better tracking.
                    </div>
                  ) : (
                    <div className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Lighting is optimal for high-accuracy tracking.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-sm hover:from-cyan-300 hover:to-cyan-200 transition-all"
                >
                  Start 10s Calibration
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-400 font-heading font-semibold text-lg">
                  <Sparkles className="w-5 h-5" />
                  Step 3: 10s Calibration & Practice
                </div>
                <span className="font-mono text-base px-2.5 py-1 rounded-lg bg-violet-950/80 text-violet-300 border border-violet-700 font-bold">
                  {calibrationCountdown}s left
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Hold each gesture toward the camera until the checkmark illuminates:
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'Open_Palm', label: 'Open Palm' },
                  { key: 'Closed_Fist', label: 'Closed Fist' },
                  { key: 'Pointing_Up', label: 'Pointing Up' },
                  { key: 'Victory', label: 'Victory (✌)' },
                ].map((item) => {
                  const isDone = calibratedGestures[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="font-bold">{isDone ? '✓ Done' : 'Pending'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setCalibrationCountdown(10);
                    setCalibratedGestures({
                      Open_Palm: false,
                      Closed_Fist: false,
                      Pointing_Up: false,
                      Victory: false,
                    });
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart 10s
                </button>
                <button
                  onClick={() => navigate('/modes')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950 font-heading font-bold text-sm hover:opacity-90 transition-all shadow-glow-violet"
                >
                  Enter Workspaces Hub
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

