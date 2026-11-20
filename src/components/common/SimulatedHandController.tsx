import React, { useState, useEffect, useRef } from 'react';
import { masterGestureEngine } from '../../engine';
import { Hand, MousePointer, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';

export const SimulatedHandController: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => masterGestureEngine.isSimulatedHand);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [activePose, setActivePose] = useState<string>('Open_Palm');
  const [followMouse, setFollowMouse] = useState<boolean>(true);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const isDraggingRef = useRef<boolean>(false);

  // Sync with engine
  useEffect(() => {
    const unsub = masterGestureEngine.subscribe(() => {
      if (masterGestureEngine.isSimulatedHand !== enabled) {
        setEnabled(masterGestureEngine.isSimulatedHand);
      }
    });
    return unsub;
  }, [enabled]);

  // Global mouse move listener when followMouse is active
  useEffect(() => {
    if (!enabled || !followMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      // If user is clicking buttons in this controller, ignore
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.simulated-hand-panel')) return;

      const normX = Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth));
      const normY = Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight));

      setPosition({ x: normX, y: normY });
      masterGestureEngine.simulatedPos = { x: normX, y: normY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, followMouse]);

  if (!enabled) return null;

  const handleSelectPose = (pose: string) => {
    setActivePose(pose);
    masterGestureEngine.simulatedPose = pose;

    if (pose === 'Swipe_Left') {
      masterGestureEngine.triggerSimulatedSwipe('Swipe_Left');
    } else if (pose === 'Swipe_Right') {
      masterGestureEngine.triggerSimulatedSwipe('Swipe_Right');
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const normX = Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth));
    const normY = Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight));
    setPosition({ x: normX, y: normY });
    masterGestureEngine.simulatedPos = { x: normX, y: normY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  return (
    <>
      {/* Draggable indicator on screen */}
      <div
        style={{
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="fixed -translate-x-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full border-2 border-primary bg-primary/20 shadow-elevated flex items-center justify-center cursor-grab active:cursor-grabbing backdrop-blur-xs select-none"
        title="Simulated Hand Position (drag to reposition)"
      >
        <Hand className="w-5 h-5 text-primary animate-pulse" />
      </div>

      {/* Controller floating dock */}
      <div className="simulated-hand-panel fixed bottom-4 left-4 z-40 w-80 sm:w-96 rounded-2xl bg-surface/95 text-foreground border border-primary/40 shadow-card backdrop-blur-md overflow-hidden select-none text-xs">
        {/* Header */}
        <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-bold text-primary">
            <Sparkles className="w-4 h-4 text-primary animate-spin" />
            <span>Simulated Hand Active</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((m) => !m)}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
              title={minimized ? 'Expand' : 'Collapse'}
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                masterGestureEngine.setSimulatedHand(false);
                setEnabled(false);
              }}
              className="p-1 rounded-md text-muted hover:text-error hover:bg-error/10 transition-colors"
              title="Turn off Simulated Hand"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="p-3 space-y-3">
            {/* Pose picker */}
            <div>
              <span className="text-[11px] font-heading font-semibold text-muted block mb-1.5">
                Switch Synthetic Gesture Pose:
              </span>
              <div className="grid grid-cols-4 gap-1.5 font-heading text-[11px]">
                {[
                  { id: 'Open_Palm', label: '✋ Open' },
                  { id: 'Closed_Fist', label: '✊ Fist' },
                  { id: 'Pointing_Up', label: '☝️ Point' },
                  { id: 'Pinch', label: '🤏 Pinch' },
                  { id: 'Thumb_Up', label: '👍 Thumb Up' },
                  { id: 'Victory', label: '✌️ Victory' },
                  { id: 'Swipe_Left', label: '👈 Swipe L' },
                  { id: 'Swipe_Right', label: '👉 Swipe R' },
                ].map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => handleSelectPose(pose.id)}
                    className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                      activePose === pose.id
                        ? 'bg-primary text-white border-primary shadow-soft font-bold'
                        : 'bg-surface hover:bg-surface-secondary border-border text-foreground'
                    }`}
                  >
                    {pose.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFollowMouse((f) => !f)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    followMouse
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-surface border-border text-muted'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>{followMouse ? 'Mouse Follow: ON' : 'Mouse Follow: OFF'}</span>
                </button>
              </div>

              <div className="text-muted font-mono text-[10px]">
                X: {(position.x * 100).toFixed(0)}% · Y: {(position.y * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
