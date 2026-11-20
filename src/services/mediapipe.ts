import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

let recognizerInstance: GestureRecognizer | null = null;
let recognizerPromise: Promise<GestureRecognizer> | null = null;
let lastInitError: string | null = null;

export interface MediaPipeStatus {
  isLoaded: boolean;
  isLoading: boolean;
  delegate: 'GPU' | 'CPU' | null;
  error: string | null;
}

let currentDelegate: 'GPU' | 'CPU' | null = null;

export function getMediaPipeStatus(): MediaPipeStatus {
  return {
    isLoaded: recognizerInstance !== null,
    isLoading: recognizerPromise !== null && recognizerInstance === null,
    delegate: currentDelegate,
    error: lastInitError,
  };
}

/**
 * Reset singleton recognizer if retry is requested
 */
export function resetGestureRecognizer(): void {
  if (recognizerInstance) {
    try {
      recognizerInstance.close();
    } catch {
      // Ignored
    }
    recognizerInstance = null;
  }
  recognizerPromise = null;
  lastInitError = null;
  currentDelegate = null;
}

/**
 * Initializes and returns the MediaPipe GestureRecognizer instance as a true singleton.
 * Created once, reused across pages, safe against React 19 StrictMode double-mounting.
 * Handles automatic GPU -> CPU fallback and 15s timeout.
 */
export async function getGestureRecognizer(): Promise<GestureRecognizer> {
  // If already instantiated, return immediate singleton
  if (recognizerInstance) {
    return recognizerInstance;
  }

  // If initialization is in progress, await the ongoing promise
  if (recognizerPromise) {
    return recognizerPromise;
  }

  recognizerPromise = new Promise<GestureRecognizer>((resolve, reject) => {
    let isSettled = false;

    // 15-second timeout safeguard
    const timeoutId = window.setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        recognizerPromise = null;
        lastInitError = 'Model loading timed out after 15 seconds. Please check network/files or click Retry.';
        console.error('[MediaPipe]', lastInitError);
        reject(new Error(lastInitError));
      }
    }, 15000);

    (async () => {
      try {
        console.log('[MediaPipe] Initializing FilesetResolver with local WASM binaries...');
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('/wasm');
        } catch (wasmErr) {
          throw new Error(`WASM binary load failure from /wasm: ${wasmErr instanceof Error ? wasmErr.message : String(wasmErr)}`);
        }

        const modelPath = '/models/gesture_recognizer.task';

        // Check if model file exists / reachable
        try {
          const headCheck = await fetch(modelPath, { method: 'HEAD' });
          if (!headCheck.ok && headCheck.status === 404) {
            throw new Error(`Model file not found (404) at ${modelPath}`);
          }
        } catch (fetchErr) {
          if (fetchErr instanceof Error && fetchErr.message.includes('404')) {
            throw fetchErr;
          }
          // Network errors in offline mode can proceed to local worker
        }

        // Attempt 1: GPU delegate for high performance
        try {
          console.log('[MediaPipe] Attempting GestureRecognizer with GPU delegate...');
          const instance = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.4,
            minHandPresenceConfidence: 0.4,
            minTrackingConfidence: 0.4,
          });
          currentDelegate = 'GPU';
          recognizerInstance = instance;
          lastInitError = null;
          console.log('[MediaPipe] Loaded successfully with GPU delegate.');
          if (!isSettled) {
            isSettled = true;
            window.clearTimeout(timeoutId);
            resolve(instance);
          }
          return;
        } catch (gpuErr) {
          console.warn('[MediaPipe] GPU delegate failed. Automatically falling back to CPU delegate:', gpuErr);
        }

        // Attempt 2: CPU fallback
        console.log('[MediaPipe] Attempting GestureRecognizer with CPU delegate...');
        const cpuInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        currentDelegate = 'CPU';
        recognizerInstance = cpuInstance;
        lastInitError = null;
        console.log('[MediaPipe] Loaded successfully with CPU delegate fallback.');

        if (!isSettled) {
          isSettled = true;
          window.clearTimeout(timeoutId);
          resolve(cpuInstance);
        }
      } catch (err: unknown) {
        if (!isSettled) {
          isSettled = true;
          window.clearTimeout(timeoutId);
          recognizerPromise = null;
          const msg = err instanceof Error ? err.message : String(err);
          lastInitError = msg;
          console.error('[MediaPipe] Initialization failed:', msg);
          reject(err);
        }
      }
    })();
  });

  return recognizerPromise;
}
