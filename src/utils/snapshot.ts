import { getSetting, setSetting, logGestureEvent } from '../db/db';
import { masterGestureEngine } from '../engine/masterEngine';
import { drawHandSkeleton } from './handDrawer';
import { voiceService } from '../services/voice';

export interface StoredSnapshot {
  id: string;
  filename: string;
  blob: Blob;
  dataUrl?: string;
  timestamp: number;
  mode: 'camera' | 'page' | 'screen';
  width: number;
  height: number;
}

let activeScreenStream: MediaStream | null = null;
let lastSnapshotTime = 0;
const SNAPSHOT_COOLDOWN_MS = 2000;

export async function enableScreenCapture(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
      } as MediaTrackConstraints,
      audio: false,
    });
    activeScreenStream = stream;
    stream.getVideoTracks()[0].onended = () => {
      activeScreenStream = null;
    };
    return true;
  } catch (err) {
    console.warn('[Snapshot] Screen capture permission denied or cancelled:', err);
    return false;
  }
}

export function isScreenCaptureActive(): boolean {
  return activeScreenStream !== null && activeScreenStream.active;
}

export function stopScreenCapture(): void {
  if (activeScreenStream) {
    activeScreenStream.getTracks().forEach((t) => t.stop());
    activeScreenStream = null;
  }
}

/**
 * Synthesizes a realistic camera shutter click/snap using Web Audio API
 */
export function playShutterSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Stage 1: Quick high-frequency click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
    oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);

    // Stage 2: Shutter slap noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime + 0.025);
  } catch {
    // Audio unsupported or blocked
  }
}

/**
 * Triggers a short white flash overlay on the viewport/preview
 */
export function triggerSnapshotFlash(): void {
  if (typeof document === 'undefined') return;
  const flash = document.createElement('div');
  flash.className = 'pointer-events-none fixed inset-0 z-[99999] bg-white transition-opacity duration-150 ease-out';
  flash.style.opacity = '0.8';
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 200);
  });
}

/**
 * Stores and manages directory handles using IndexedDB
 */
export async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return getSetting<FileSystemDirectoryHandle | null>('snapshot_save_dir_handle', null);
}

export async function setSavedDirectoryHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  await setSetting('snapshot_save_dir_handle', handle);
}

/**
 * Load all stored snapshots from IndexedDB
 */
export async function getStoredSnapshots(): Promise<StoredSnapshot[]> {
  const snapshots = await getSetting<StoredSnapshot[]>('aerotouch_snapshots_list', []);
  return snapshots.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Save snapshot to IndexedDB gallery
 */
export async function addStoredSnapshot(snapshot: StoredSnapshot): Promise<void> {
  const list = await getStoredSnapshots();
  list.unshift(snapshot);
  // Keep up to 50 recent snapshots in IndexedDB
  const trimmed = list.slice(0, 50);
  await setSetting('aerotouch_snapshots_list', trimmed);
}

/**
 * Delete a single stored snapshot
 */
export async function deleteStoredSnapshot(id: string): Promise<void> {
  const list = await getStoredSnapshots();
  const filtered = list.filter((s) => s.id !== id);
  await setSetting('aerotouch_snapshots_list', filtered);
}

/**
 * Clear all stored snapshots
 */
export async function clearStoredSnapshots(): Promise<void> {
  await setSetting('aerotouch_snapshots_list', []);
}

export interface CaptureSnapshotOptions {
  mode?: 'camera' | 'page' | 'screen';
  videoElement?: HTMLVideoElement | null;
  overlayCanvas?: HTMLCanvasElement | null;
  workspaceElement?: HTMLElement | null;
  workspaceCanvas?: HTMLCanvasElement | null;
  playSound?: boolean;
}

export interface CaptureSnapshotResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  dataUrl?: string;
  error?: string;
  savedToDirectory?: boolean;
}

/**
 * Captures real screenshot based on specified mode, applies watermark,
 * downloads or saves silently to selected folder, stores in gallery, and logs event.
 */
export async function captureSnapshot(
  options: CaptureSnapshotOptions = {}
): Promise<CaptureSnapshotResult> {
  const now = Date.now();
  if (now - lastSnapshotTime < SNAPSHOT_COOLDOWN_MS) {
    return {
      success: false,
      error: `Cooldown active (${Math.ceil((SNAPSHOT_COOLDOWN_MS - (now - lastSnapshotTime)) / 1000)}s)`,
    };
  }

  const configuredMode = (await getSetting<'camera' | 'page' | 'screen'>('snapshot_mode', 'camera')) || 'camera';
  const mode = options.mode || configuredMode;

  let offscreenCanvas: HTMLCanvasElement;
  let targetW = 640;
  let targetH = 480;

  try {
    if (mode === 'screen' && isScreenCaptureActive() && activeScreenStream) {
      // 1. Screen Capture
      const videoTrack = activeScreenStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      targetW = settings.width || 1280;
      targetH = settings.height || 720;

      const trackVideo = document.createElement('video');
      trackVideo.srcObject = activeScreenStream;
      trackVideo.muted = true;
      trackVideo.playsInline = true;
      await trackVideo.play();

      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      ctx.drawImage(trackVideo, 0, 0, targetW, targetH);
      trackVideo.pause();
      trackVideo.srcObject = null;
    } else if (mode === 'page' && options.workspaceCanvas) {
      // 2. Page workspace direct canvas capture
      const srcCanvas = options.workspaceCanvas;
      targetW = srcCanvas.width;
      targetH = srcCanvas.height;
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');
      ctx.drawImage(srcCanvas, 0, 0);
    } else {
      // 3. Camera Snapshot (Default)
      const video = options.videoElement || (document.querySelector('video') as HTMLVideoElement | null);
      if (!video || video.readyState < 2) {
        throw new Error('Camera feed is not ready for snapshot');
      }

      targetW = video.videoWidth || 640;
      targetH = video.videoHeight || 480;
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      // Mirrored camera frame (matching preview exactly)
      ctx.save();
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, targetW, targetH);
      ctx.restore();

      // Hand skeleton overlay: draw directly onto snapshot canvas using latest rendered landmarks
      const landmarks =
        masterGestureEngine.renderedLandmarks && masterGestureEngine.renderedLandmarks.length === 21
          ? masterGestureEngine.renderedLandmarks
          : masterGestureEngine.targetLandmarks && masterGestureEngine.targetLandmarks.length === 21
          ? masterGestureEngine.targetLandmarks
          : masterGestureEngine.latestLandmarks && masterGestureEngine.latestLandmarks.length === 21
          ? masterGestureEngine.latestLandmarks
          : null;

      if (landmarks && landmarks.length === 21) {
        drawHandSkeleton(
          ctx,
          landmarks,
          targetW,
          targetH,
          true,
          masterGestureEngine.state.filteredGesture || 'None',
          masterGestureEngine.state.confidence || 0,
          masterGestureEngine.skeletonStyle || 'Glow',
          true
        );
      }
    }

    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context for watermark');

    // 4. Timestamp Watermark
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const watermarkText = `AeroTouch • ${dateStr}`;

    ctx.save();
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    const textMetrics = ctx.measureText(watermarkText);
    const boxW = textMetrics.width + 18;
    const boxH = 26;
    const boxX = targetW - boxW - 14;
    const boxY = targetH - boxH - 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(boxX + 11, boxY + boxH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(watermarkText, boxX + 20, boxY + 17);
    ctx.restore();

    // 5. Convert to PNG Blob
    const blob = await new Promise<Blob | null>((resolve) =>
      offscreenCanvas.toBlob(resolve, 'image/png')
    );

    if (!blob) {
      throw new Error('Failed to encode image blob from canvas');
    }

    const filename = `AeroTouch_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.png`;
    const dataUrl = offscreenCanvas.toDataURL('image/png');

    // 6. Save File: Silent Directory Handle (Chrome/Edge) or Auto-Download
    let savedToDirectory = false;
    const dirHandle = await getSavedDirectoryHandle();

    if (dirHandle) {
      try {
        const handle = dirHandle as unknown as {
          queryPermission: (opts: { mode: string }) => Promise<string>;
          requestPermission: (opts: { mode: string }) => Promise<string>;
          getFileHandle: (name: string, opts: { create: boolean }) => Promise<{
            createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
          }>;
        };
        let perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          perm = await handle.requestPermission({ mode: 'readwrite' });
        }
        if (perm === 'granted') {
          const fileHandle = await handle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedToDirectory = true;
        }
      } catch (dirErr) {
        console.warn('[Snapshot] Folder write failed, falling back to download:', dirErr);
      }
    }

    if (!savedToDirectory && typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    // 7. Shutter sound and flash
    const soundEnabled = await getSetting<boolean>('sound_enabled', true);
    if (options.playSound !== false && soundEnabled) {
      playShutterSound();
    }
    triggerSnapshotFlash();

    // 8. Add to IndexedDB Gallery
    const snapshotRecord: StoredSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      filename,
      blob,
      dataUrl,
      timestamp: Date.now(),
      mode,
      width: targetW,
      height: targetH,
    };
    await addStoredSnapshot(snapshotRecord);

    // 9. Log Gesture Event
    await logGestureEvent('Victory', 'SCREENSHOT', 0.95, mode);

    // 10. Voice feedback confirmation
    voiceService.speakPhrase('screenshot_saved');

    lastSnapshotTime = Date.now();

    return {
      success: true,
      filename,
      blob,
      dataUrl,
      savedToDirectory,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Snapshot] Failed:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
