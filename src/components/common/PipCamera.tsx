import React, { useRef, useState, useEffect } from 'react';
import { useGestureEngine } from '../../engine';
import { useCamera } from '../../context/CameraContext';
import { useSpeechFeedback } from '../../hooks/useSpeechFeedback';
import { Camera, CameraOff, ChevronDown, ChevronUp, Eye, EyeOff, Radio } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { HandOverlayCanvas } from './HandOverlayCanvas';

interface PipCameraProps {
  onAction?: (action: string) => void;
  onLandmarks?: (landmarks: NormalizedLandmark[]) => void;
  docked?: boolean;
}

export const PipCamera: React.FC<PipCameraProps> = ({ onAction, onLandmarks, docked = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [minimized, setMinimized] = useState<boolean>(() => {
    return localStorage.getItem('aerotouch_pip_minimized') === 'true';
  });
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Live caption overlay for 1.2s on gesture
  const [caption, setCaption] = useState<string | null>(null);
  const captionTimerRef = useRef<number | null>(null);

  const { isStreaming, isLoading, toggleCamera, stopCamera } = useCamera();
  const { speak } = useSpeechFeedback();

  const getActionPhrase = (action: string, gesture: string): string => {
    const gestureFormatted = gesture.replace('_', ' ');
    switch (action) {
      case 'NEXT': return `${gestureFormatted}: Next slide`;
      case 'PREV': return `${gestureFormatted}: Previous slide`;
      case 'PAUSE': return `${gestureFormatted}: Paused`;
      case 'PLAY': return `${gestureFormatted}: Resumed`;
      case 'VOLUME_UP': return `${gestureFormatted}: Volume up`;
      case 'VOLUME_DOWN': return `${gestureFormatted}: Volume down`;
      case 'CLICK': return `${gestureFormatted}: Click`;
      case 'SCREENSHOT': return `${gestureFormatted}: Screenshot captured`;
      case 'SCROLL_UP': return `${gestureFormatted}: Scroll up`;
      case 'SCROLL_DOWN': return `${gestureFormatted}: Scroll down`;
      default: return `${gestureFormatted}: ${action.replace('_', ' ')}`;
    }
  };

  const { state, getLandmarks } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: showSkeleton,
    onAction: (action, gesture) => {
      const phrase = getActionPhrase(action, gesture);
      setCaption(phrase);
      if (captionTimerRef.current) window.clearTimeout(captionTimerRef.current);
      captionTimerRef.current = window.setTimeout(() => setCaption(null), 1200);

      speak(phrase.split(': ')[1] || phrase);
      if (onAction) onAction(action);
    },
  });

  const statusLabel = !isStreaming
    ? 'Off'
    : isLoading
      ? 'Starting'
      : state.isLowLight
        ? 'Low light'
        : state.hasHand
          ? 'Tracking'
          : 'No hand';

  const statusDotColor =
    statusLabel === 'Off'
      ? 'bg-muted'
      : statusLabel === 'Starting'
        ? 'bg-warning animate-pulse'
        : statusLabel === 'Tracking'
          ? 'bg-success animate-pulse'
          : statusLabel === 'Low light'
            ? 'bg-amber-500 animate-pulse'
            : 'bg-cyan-400 animate-pulse';

  useEffect(() => {
    if (onLandmarks && state.hasHand) {
      const landmarks = getLandmarks();
      if (landmarks && landmarks.length > 0) {
        onLandmarks(landmarks);
      }
    }
  }, [state.hasHand, state.wristVelocity, getLandmarks, onLandmarks]);

  const toggleMin = () => {
    setMinimized((prev) => {
      const next = !prev;
      localStorage.setItem('aerotouch_pip_minimized', String(next));
      return next;
    });
  };

  return (
    <aside
      aria-label="Gesture Tracking Camera Widget"
      className={
        docked
          ? 'w-40 sm:w-44 flex flex-col items-end gap-1.5 select-none'
          : 'fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5 select-none'
      }
    >
      {/* Live Action Caption Pill: dark translucent pill (rgba(11,18,32,0.72)) with white text, 14-16px */}
      {caption && (
        <div
          style={{ backgroundColor: 'rgba(11, 18, 32, 0.72)' }}
          className="px-3.5 py-1.5 rounded-full text-white text-sm font-heading font-bold shadow-card flex items-center gap-2 border border-white/10 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{caption}</span>
        </div>
      )}

      {/* Camera Card */}
      <div className="w-full rounded-2xl panel-card border border-border bg-surface text-foreground shadow-card overflow-hidden">
        {/* Header bar */}
        <div className="px-3 py-1.5 bg-surface-secondary border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-heading font-semibold text-foreground">
            <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
            <span className="text-[11px]">{statusLabel}</span>
            {isStreaming && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Cam {state.cameraFps || 30} · AI {state.fps || 0}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isStreaming ? (
              <button
                onClick={() => stopCamera()}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-error/10 border border-error/30 text-error hover:bg-error/20 text-[10px] font-heading font-medium transition-colors"
                title="Stop Camera"
                aria-label="Stop Camera"
              >
                <CameraOff className="w-3 h-3" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => toggleCamera()}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[10px] font-heading font-medium transition-colors"
                title="Start Camera"
                aria-label="Start Camera"
              >
                <Camera className="w-3 h-3" />
                <span>Start</span>
              </button>
            )}

            <button
              onClick={toggleMin}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
              title={minimized ? 'Expand Camera' : 'Minimize Camera'}
              aria-label={minimized ? 'Expand Camera' : 'Minimize Camera'}
            >
              {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Viewport content */}
        {!minimized && (
          <div className="p-2 space-y-2">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface-secondary border border-border flex items-center justify-center">
              {isStreaming ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                  <HandOverlayCanvas drawSkeleton={showSkeleton} />

                  {/* No hand guide pill */}
                  {!state.hasHand && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full px-2">
                      <div
                        style={{ backgroundColor: 'rgba(11, 18, 32, 0.72)' }}
                        className="px-2 py-0.5 rounded-full text-white text-[10px] flex items-center justify-center gap-1 shadow-md backdrop-blur-sm"
                      >
                        <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                        <span>Show hand</span>
                      </div>
                    </div>
                  )}

                  {/* Active gesture pill */}
                  {state.filteredGesture !== 'None' && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div
                        style={{ backgroundColor: 'rgba(11, 18, 32, 0.72)' }}
                        className="px-2.5 py-1 rounded-full text-white text-xs font-heading font-semibold shadow-md backdrop-blur-sm flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{state.filteredGesture.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center text-muted gap-1">
                  <CameraOff className="w-5 h-5 opacity-40" />
                  <span className="text-[10px]">Camera inactive</span>
                </div>
              )}
            </div>

            {/* Bottom mini controls */}
            {isStreaming && (
              <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-1">
                <button
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {showSkeleton ? <Eye className="w-3 h-3 text-primary" /> : <EyeOff className="w-3 h-3" />}
                  <span>{showSkeleton ? 'Skeleton' : 'Hide'}</span>
                </button>
                <span>{state.fps} FPS</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
