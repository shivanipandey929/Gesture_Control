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
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { customKNN } from '../engine/knnClassifier';
import {
  saveCustomGesture,
  getAllCustomGestures,
  deleteCustomGesture,
  type CustomGestureRecord,
  type NormalizedSample
} from '../db/db';

export const CustomTrainer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [gestureName, setGestureName] = useState('');
  const [selectedAction, setSelectedAction] = useState('play');
  const [samples, setSamples] = useState<NormalizedSample[]>([]);
  const [trainedList, setTrainedList] = useState<CustomGestureRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { state, getLandmarks } = useGestureEngine(videoRef, undefined, {
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

    const currentRaw = getLandmarks();
    const lms = currentRaw && currentRaw.length === 21
      ? currentRaw.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z ?? 0 }))
      : Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));

    const currentSample: NormalizedSample = { landmarks: lms };

    setSamples((prev) => [...prev, currentSample]);
  };

  const handleSaveGesture = async () => {
    if (!gestureName.trim()) {
      alert('Please enter a gesture name.');
      return;
    }
    if (samples.length < 8) {
      alert('Please record all 8 posture samples first.');
      return;
    }

    await saveCustomGesture(gestureName.trim(), selectedAction, samples);
    setGestureName('');
    setSamples([]);
    await loadTrained();
    setSuccessMessage(`Custom gesture "${gestureName}" saved successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-medium mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>K-Nearest Neighbors Classifier</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
            Custom Gesture Studio
          </h1>
          <p className="text-muted text-sm mt-1">
            Train proprietary hand poses with 8-shot samples stored in local IndexedDB.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Camera Preview & Sample Recorder */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden panel-card border border-border shadow-card bg-surface-secondary">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <HandOverlayCanvas />

            {/* Gesture Detection HUD */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-surface/90 border border-border text-xs font-mono text-foreground backdrop-blur-sm shadow-soft">
              Live: {state.filteredGesture} ({Math.round(state.confidence * 100)}%)
            </div>

            {/* 8-Sample Progress Indicator */}
            <div className="absolute bottom-4 inset-x-4 z-20 p-3 rounded-2xl bg-surface/90 border border-border backdrop-blur-md flex items-center justify-between gap-4 shadow-soft">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-semibold text-foreground">Samples:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all ${i < samples.length
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-surface-secondary border border-border text-muted'
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
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-secondary text-muted hover:text-foreground text-xs transition-colors"
                  title="Clear Samples"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCaptureSample}
                  disabled={samples.length >= 8}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-xs disabled:opacity-50 transition-colors shadow-soft flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture Sample ({samples.length}/8)
                </button>
              </div>
            </div>
          </div>

          {/* Form & Action Assignment */}
          <div className="p-6 rounded-3xl panel-card border border-border flex flex-col sm:flex-row items-stretch sm:items-end gap-4 shadow-soft">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-heading font-semibold text-muted">
                1. Custom Gesture Name
              </label>
              <input
                type="text"
                value={gestureName}
                onChange={(e) => setGestureName(e.target.value)}
                placeholder="e.g. Peace Sign, OK Pinch, Finger Gun"
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="w-full sm:w-48 space-y-1">
              <label className="text-xs font-heading font-semibold text-muted">
                2. Assigned Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="play">Play</option>
                <option value="pause">Pause</option>
                <option value="next">Next</option>
                <option value="previous">Previous</option>
                <option value="volume_up">Volume Up</option>
                <option value="volume_down">Volume Down</option>
                <option value="click">Virtual Click</option>
              </select>
            </div>

            <button
              onClick={handleSaveGesture}
              disabled={samples.length < 8 || !gestureName.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-card"
            >
              <Save className="w-4 h-4" />
              Save Gesture
            </button>
          </div>
        </div>

        {/* Right Col: Trained Model Registry */}
        <div className="p-6 rounded-3xl panel-card border border-border flex flex-col gap-4 shadow-soft">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Trained Gestures ({trainedList.length})
            </h3>
            <span className="text-[10px] font-mono text-muted">IndexedDB</span>
          </div>

          {trainedList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No custom gestures trained yet. Capture 8 samples to teach your first gesture.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {trainedList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-heading font-bold text-foreground block">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-primary uppercase">
                      Action: {item.action}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl border border-border text-muted hover:text-error hover:bg-rose-500/10 transition-colors"
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
  );
};

export default CustomTrainer;
