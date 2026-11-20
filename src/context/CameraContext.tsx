import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type CameraErrorType = 'denied' | 'busy' | 'not-found' | 'overconstrained' | 'model-error' | string | null;

export type CameraLoadingPhase = 'idle' | 'requesting-camera' | 'loading-model' | 'tracking';

export interface CameraDiagnostics {
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  deviceName: string;
  resolution: { width: number; height: number };
  fps: number;
  inferenceMs: number;
  handsDetected: number;
  modelLoaded: boolean;
}

interface CameraContextType {
  stream: MediaStream | null;
  isStreaming: boolean;
  isLoading: boolean;
  loadingPhase: CameraLoadingPhase;
  setLoadingPhase: (phase: CameraLoadingPhase) => void;
  hasUserConsent: boolean;
  error: CameraErrorType;
  errorMessage: string | null;
  grantConsentAndStart: () => Promise<boolean>;
  toggleCamera: () => Promise<void>;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  diagnostics: CameraDiagnostics;
  setDiagnostics: (updates: Partial<CameraDiagnostics>) => void;
  lowEndMode: boolean;
  setLowEndMode: (val: boolean) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<CameraLoadingPhase>('idle');
  const [hasUserConsent, setHasUserConsent] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('aerotouch_camera_consent') === 'true';
  });
  const [error, setError] = useState<CameraErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [diagnostics, setDiagnosticsState] = useState<CameraDiagnostics>({
    permissionState: 'unknown',
    deviceName: 'Default Camera',
    resolution: { width: 0, height: 0 },
    fps: 0,
    inferenceMs: 0,
    handsDetected: 0,
    modelLoaded: false,
  });

  const [lowEndMode, setLowEndMode] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('aerotouch_low_end_mode') === 'true';
  });

  const streamRef = useRef<MediaStream | null>(null);
  const hiddenTimerRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const setDiagnostics = useCallback((updates: Partial<CameraDiagnostics>) => {
    setDiagnosticsState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check camera permissions if supported
  const checkPermissionState = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setDiagnosticsState((prev) => ({ ...prev, permissionState: status.state as any }));
        status.onchange = () => {
          setDiagnosticsState((prev) => ({ ...prev, permissionState: status.state as any }));
        };
      } catch {
        // Ignored if browser doesn't support camera permission query
      }
    }
  }, []);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch {
        // Ignored
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    checkPermissionState();
    refreshDevices();
  }, [checkPermissionState, refreshDevices]);

  // Strictly ensure all tracks are stopped and released
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch {
          // Track already stopped
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsStreaming(false);
    setIsLoading(false);
    setLoadingPhase('idle');
    setDiagnosticsState((prev) => ({
      ...prev,
      resolution: { width: 0, height: 0 },
      fps: 0,
      handsDetected: 0,
    }));
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (isStartingRef.current) return false;
    isStartingRef.current = true;

    setIsLoading(true);
    setLoadingPhase('requesting-camera');
    setError(null);
    setErrorMessage(null);

    // Stop existing stream if any
    stopCamera();

    try {
      let newStream: MediaStream;

      // Attempt 1: Optimal 640x480 constraints
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: lowEndMode ? 320 : 640 },
            height: { ideal: lowEndMode ? 240 : 480 },
            frameRate: { ideal: lowEndMode ? 15 : 30, max: 30 },
            facingMode: 'user',
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          },
          audio: false,
        };
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'OverconstrainedError') {
          // Attempt 2: Relaxed fallback constraints
          newStream = await navigator.mediaDevices.getUserMedia({
            video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
            audio: false,
          });
        } else {
          throw err;
        }
      }

      streamRef.current = newStream;
      setStream(newStream);
      setIsStreaming(true);
      setIsLoading(false);
      setLoadingPhase('loading-model');
      setHasUserConsent(true);
      localStorage.setItem('aerotouch_camera_consent', 'true');

      // Update active device info
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setDiagnosticsState((prev) => ({
          ...prev,
          deviceName: videoTrack.label || prev.deviceName,
          resolution: {
            width: settings.width || 640,
            height: settings.height || 480,
          },
          permissionState: 'granted',
        }));
      }

      await refreshDevices();
      return true;
    } catch (err: unknown) {
      setIsLoading(false);
      setIsStreaming(false);
      setLoadingPhase('idle');

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('denied');
          setErrorMessage(
            'Camera access was denied. In Chrome: 1. Click the lock or tune icon in the address bar. 2. Enable Camera permissions. 3. Click Retry Camera.'
          );
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('busy');
          setErrorMessage(
            'Camera is busy in another application (e.g. Zoom, Google Meet, Teams, or another browser tab). Please close other camera apps and retry.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('not-found');
          setErrorMessage('No camera device was detected on your computer. Please connect a webcam and retry.');
        } else if (err.name === 'OverconstrainedError') {
          setError('overconstrained');
          setErrorMessage('The selected camera resolution is not supported by your hardware.');
        } else {
          setError(err.name);
          setErrorMessage(err.message || 'Failed to open camera.');
        }
      } else {
        setError('unknown');
        setErrorMessage('Failed to access camera.');
      }
      return false;
    } finally {
      isStartingRef.current = false;
    }
  }, [lowEndMode, selectedDeviceId, stopCamera, refreshDevices]);

  const grantConsentAndStart = async () => {
    return await startCamera();
  };

  const toggleCamera = async () => {
    if (isStreaming) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  // Switch camera device
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isStreaming) {
      setTimeout(() => {
        startCamera();
      }, 50);
    }
  };

  // Background tab timer: turn off camera after 30 seconds of tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimerRef.current = window.setTimeout(() => {
          stopCamera();
        }, 30000);
      } else {
        if (hiddenTimerRef.current) {
          clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (hiddenTimerRef.current) {
        clearTimeout(hiddenTimerRef.current);
      }
    };
  }, [stopCamera]);

  // Global 'C' shortcut to toggle camera On/Off
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleCamera]);

  // Clean up on component unmount (StrictMode safety)
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <CameraContext.Provider
      value={{
        stream,
        isStreaming,
        isLoading,
        loadingPhase,
        setLoadingPhase,
        hasUserConsent,
        error,
        errorMessage,
        grantConsentAndStart,
        toggleCamera,
        startCamera,
        stopCamera,
        devices,
        selectedDeviceId,
        setSelectedDeviceId: handleDeviceChange,
        diagnostics,
        setDiagnostics,
        lowEndMode,
        setLowEndMode: (val: boolean) => {
          setLowEndMode(val);
          localStorage.setItem('aerotouch_low_end_mode', String(val));
          if (isStreaming) {
            startCamera();
          }
        },
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}
