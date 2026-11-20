import { useEffect, useRef, useState, useCallback } from 'react';
import { resetGestureRecognizer } from '../services/mediapipe';
import { useCamera } from '../context/CameraContext';
import { useGesture, type GestureAction } from '../context/GestureContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { masterGestureEngine } from './masterEngine';
import type { GestureEngineState } from './types';

export function useGestureEngine(
  videoRef?: React.RefObject<HTMLVideoElement | null>,
  _canvasRef?: React.RefObject<HTMLCanvasElement | null>,
  options?: {
    drawSkeleton?: boolean;
    sensitivity?: 'relaxed' | 'normal' | 'strict';
    onAction?: (action: GestureAction | string, gesture: string) => void;
  }
) {
  const { stream, isStreaming, setDiagnostics } = useCamera();
  const { dispatchAction } = useGesture();
  const { recordHandPresence } = useAccessibility();

  const [state, setState] = useState<GestureEngineState>(masterGestureEngine.state);
  const onActionRef = useRef(options?.onAction);
  
  useEffect(() => {
    onActionRef.current = options?.onAction;
  }, [options?.onAction]);

  // Sync callbacks with master engine
  useEffect(() => {
    masterGestureEngine.dispatchActionFn = dispatchAction;
    masterGestureEngine.recordHandPresenceFn = recordHandPresence;
    masterGestureEngine.setDiagnosticsFn = setDiagnostics;
  }, [dispatchAction, recordHandPresence, setDiagnostics]);

  // Feed shared stream to master engine
  useEffect(() => {
    masterGestureEngine.setStream(isStreaming ? stream : null);
  }, [stream, isStreaming]);

  // Feed stream to local visible video element
  useEffect(() => {
    if (videoRef?.current) {
      if (stream && isStreaming) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isStreaming, videoRef]);

  // Canvas registration is canonically owned by HandOverlayCanvas component to ensure
  // exact mount/unmount and resize lifecycle alignment.

  // Subscribe to shared state updates
  useEffect(() => {
    const unsubscribe = masterGestureEngine.subscribe((newState) => {
      setState(newState);
      if (newState.lastAction && onActionRef.current) {
        onActionRef.current(newState.lastAction, newState.filteredGesture);
      }
    });
    return unsubscribe;
  }, []);

  const setSensitivity = useCallback((sens: 'relaxed' | 'normal' | 'strict') => {
    masterGestureEngine.setSensitivity(sens);
  }, []);

  const getLandmarks = useCallback(() => {
    return masterGestureEngine.latestLandmarks;
  }, []);

  const toggleBrightnessBoost = useCallback(() => {
    setState((prev) => ({ ...prev, brightnessBoost: !prev.brightnessBoost }));
  }, []);

  const retryModel = useCallback(() => {
    resetGestureRecognizer();
    masterGestureEngine.stopLoop();
    masterGestureEngine.startLoop();
  }, []);

  return {
    state,
    getLandmarks,
    setSensitivity,
    brightnessBoost: state.brightnessBoost,
    toggleBrightnessBoost,
    retryModel,
  };
}
