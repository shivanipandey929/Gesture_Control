import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

let gestureRecognizerPromise: Promise<GestureRecognizer> | null = null;

/**
 * Initializes and returns the MediaPipe GestureRecognizer instance.
 * Completely offline: loads WASM from /wasm and model from /models/gesture_recognizer.task
 */
export async function getGestureRecognizer(): Promise<GestureRecognizer> {
  if (gestureRecognizerPromise) {
    return gestureRecognizerPromise;
  }

  gestureRecognizerPromise = (async () => {
    try {
      // Load WebAssembly binaries locally from public/wasm
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      try {
        // Attempt with GPU acceleration first for best FPS
        return await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed, falling back to CPU delegate:', gpuError);
        return await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/gesture_recognizer.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      }
    } catch (err) {
      gestureRecognizerPromise = null; // allow retry
      console.error('Failed to initialize MediaPipe GestureRecognizer:', err);
      throw err;
    }
  })();

  return gestureRecognizerPromise;
}

