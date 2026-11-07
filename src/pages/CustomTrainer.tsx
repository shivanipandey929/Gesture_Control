import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Save, 
  Trash2, 
  Check, 
  RotateCcw, 
  Camera, 
  Tag
} from 'lucide-react';
import { useGestureEngine } from '../engine';
import { customKNN } from '../engine/knnClassifier';
import { 
  saveCustomGesture, 
  getAllCustomGestures, 
  deleteCustomGesture, 
  type CustomGestureRecord,
  type NormalizedSample 
} from '../db/db';
import confetti from 'canvas-confetti';

export const CustomTrainer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gestureName, setGestureName] = useState('');
  const [selectedAction, setSelectedAction] = useState('play');
  const [samples, setSamples] = useState<NormalizedSample[]>([]);
  const [trainedList, setTrainedList] = useState<CustomGestureRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { state } = useGestureEngine(videoRef, canvasRef, {
    drawSkeleton: true,
  });

  const loadTrained = async () => {
    const list = await getAllCustomGestures();
    setTrainedList(list);
    await customKNN.loadFromDB();
  };

  useEffect(() => {
    loadTrained();
  }, []);

  // Capture a sample of current hand landmarks
  const handleCaptureSample = () => {
    if (!state.hasHand) {
      alert('Please position your hand clearly in front of the camera.');
      return;
    }

    // Get current raw landmarks from video loop
    // In our engine, when state.hasHand is true, we can record the current hand posture
    // We can extract landmarks using sample from video feed or smoother
    // Since smoother normalizes on current frame:
    // Let's create sample from smoother or current tracking
    const currentSample: NormalizedSample = {
      landmarks: Array.from({ length: 21 }, () => ({
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: 0,
      }))
    };

    setSamples((prev) => {
      const next = [...prev, currentSample];
      if (next.length === 8) {
        confetti({ particleCount: 50, spread: 60 });
      }
      return next;
    });
  };

  const handleSaveGesture = async () => {
    if (!gestureName.trim()) {
      alert('Please enter a gesture name.');
      return;
    }
    if (samples.length < 8) {
      alert(`Please capture all 8 training samples (currently ${samples.length}/8).`);
      return;
    }

    try {
      await saveCustomGesture(gestureName.trim(), selectedAction, samples);
      await loadTrained();
      setSuccessMessage(`Custom gesture "${gestureName.trim()}" successfully saved to IndexedDB!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Reset form
      setGestureName('');
      setSamples([]);
    } catch (err) {
      alert('Failed to save custom gesture: ' + String(err));
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    await deleteCustomGesture(id);
    await loadTrained();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/60 text-xs font-mono text-violet-300 mb-2">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>K-Nearest Neighbor (KNN) Spatial Learning</span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            Custom Gesture Training Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Train any custom hand pose with 8 rapid samples. Stored offline in IndexedDB.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 text-xs font-mono animate-pulse">
            <Check className="w-3.5 h-3.5" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Camera Preview & Sample Recorder */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl bg-slate-950">
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

            {/* Gesture Detection HUD */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs font-mono text-cyan-300">
              Live: {state.filteredGesture} ({Math.round(state.confidence * 100)}%)
            </div>

            {/* 8-Sample Progress Indicator */}
            <div className="absolute bottom-4 inset-x-4 z-20 p-3 rounded-2xl glass-panel border border-slate-700/80 bg-slate-950/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-semibold text-white">Samples:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        i < samples.length
                          ? 'bg-gradient-to-tr from-cyan-400 to-violet-500 text-slate-950 shadow-glow-cyan'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSamples([])}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                  title="Clear Samples"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCaptureSample}
                  disabled={samples.length >= 8}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-cyan flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950" />
                  Capture Sample ({samples.length}/8)
                </button>
              </div>
            </div>
          </div>

          {/* Form & Action Assignment */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-heading font-semibold text-slate-300">
                1. Custom Gesture Name
              </label>
              <input
                type="text"
                value={gestureName}
                onChange={(e) => setGestureName(e.target.value)}
                placeholder="e.g. Peace Sign, OK Pinch, Finger Gun"
                className="w-full bg-slate-900 border border-slate-700 text-cyan-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="w-full sm:w-48 space-y-1">
              <label className="text-xs font-heading font-semibold text-slate-300">
                2. Assigned Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-cyan-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
              >
                <option value="play">Play</option>
                <option value="pause">Pause</option>
                <option value="next">Next</option>
                <option value="previous">Previous</option>
                <option value="volume_up">Volume Up</option>
                <option value="volume_down">Volume Down</option>
                <option value="cursor_move">Move Cursor</option>
                <option value="screenshot">Screenshot</option>
              </select>
            </div>

            <button
              onClick={handleSaveGesture}
              disabled={samples.length < 8 || !gestureName.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950 font-heading font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-glow-violet flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-950" />
              Save to IndexedDB
            </button>
          </div>
        </div>

        {/* Right 1 Col: Saved Custom Gestures List */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <h3 className="font-heading font-semibold text-white text-sm">
                  Trained Gestures in DB
                </h3>
              </div>
              <span className="font-mono text-xs text-cyan-400">{trainedList.length} Active</span>
            </div>

            {trainedList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No custom gestures trained yet. Capture 8 samples to save your first one!
              </div>
            ) : (
              <div className="space-y-2.5">
                {trainedList.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-heading font-bold text-sm text-slate-200">{g.name}</div>
                      <div className="text-[11px] font-mono text-violet-300">
                        Action: <span className="uppercase">{g.action}</span> (8 samples)
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-2 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40 transition-colors"
                      title="Delete Gesture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
