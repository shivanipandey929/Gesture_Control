let sampleCanvas: HTMLCanvasElement | null = null;
let sampleCtx: CanvasRenderingContext2D | null = null;

/**
 * Calculates average brightness (0-255) from the video element
 */
export function calculateBrightness(video: HTMLVideoElement): number {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 128;

  if (!sampleCanvas) {
    sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 48;
    sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  if (!sampleCtx) return 128;

  try {
    sampleCtx.drawImage(video, 0, 0, 64, 48);
    const imgData = sampleCtx.getImageData(0, 0, 64, 48).data;
    let totalLuminance = 0;
    const pixelCount = imgData.length / 4;

    for (let i = 0; i < imgData.length; i += 4) {
      // Standard perceptual luminance formula
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return Math.round(totalLuminance / pixelCount);
  } catch {
    return 128;
  }
}

