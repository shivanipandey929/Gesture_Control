import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  FolderOpen,
  Sparkles,
  AlertCircle,
  Disc,
  Info,
} from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';
import { useGesture } from '../../context/GestureContext';
import { getSetting, setSetting } from '../../db/db';
import { captureSnapshot } from '../../utils/snapshot';
import {
  clampVolume,
  stepVolume,
  canRepeatVolumeStep,
  TwoFingerVolumeTracker,
} from '../../utils/volumeMapping';
import { MasterGestureEngine } from '../../engine/masterEngine';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  gradient: string;
}

// Generate client-side synthesized WAV audio for instant 100% offline playback
function createSynthesizedWavBlob(freq: number, pattern: 'ambient' | 'synth' | 'groove'): string {
  const sampleRate = 22050;
  const durationSec = 30; // 30 second loopable
  const totalSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    if (pattern === 'ambient') {
      s = Math.sin(2 * Math.PI * freq * t) * 0.4 + Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.2;
      s *= Math.sin(2 * Math.PI * 0.2 * t) * 0.5 + 0.5;
    } else if (pattern === 'synth') {
      const f = freq * (1 + 0.1 * Math.sin(2 * Math.PI * 2 * t));
      s = (2 * ((f * t) % 1) - 1) * 0.35;
    } else {
      s = Math.sin(2 * Math.PI * freq * t) * 0.3 + ((i % (sampleRate / 2) < 2000 ? 0.3 : 0));
    }
    const sample = Math.max(-1, Math.min(1, s));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export const MediaWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const [playlist, setPlaylist] = useState<Track[]>(() => [
    {
      id: '1',
      title: 'Cosmic Drift',
      artist: 'AeroTouch Ambient',
      duration: 30,
      url: createSynthesizedWavBlob(220, 'ambient'),
      gradient: 'from-blue-600 to-indigo-900',
    },
    {
      id: '2',
      title: 'Neon Pulse',
      artist: 'Synthwave Beats',
      duration: 30,
      url: createSynthesizedWavBlob(330, 'synth'),
      gradient: 'from-fuchsia-600 to-purple-950',
    },
    {
      id: '3',
      title: 'Aero Flow',
      artist: 'Chillout Rhythm',
      duration: 30,
      url: createSynthesizedWavBlob(174.61, 'groove'),
      gradient: 'from-cyan-600 to-emerald-900',
    },
  ]);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [inDialMode, setInDialMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [liveCaption, setLiveCaption] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasVisualizerRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const twoFingerTrackerRef = useRef<TwoFingerVolumeTracker | null>(null);
  const lastVolumeStepTimeRef = useRef<number>(0);

  const { subscribe, setActiveMode } = useGesture();
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Set active mode and load saved volume from IndexedDB on mount
  useEffect(() => {
    setActiveMode('media');
    getSetting<number>('media_volume', 75).then((v) => {
      const clamped = clampVolume(v);
      setVolume(clamped);
      twoFingerTrackerRef.current?.setVolume(clamped / 100);
      if (audioRef.current) audioRef.current.volume = clamped / 100;
    });
  }, [setActiveMode]);

  // Flash highlight on control
  const triggerHighlight = useCallback((controlName: string, captionText: string) => {
    setActiveHighlight(controlName);
    setLiveCaption(captionText);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setActiveHighlight(null);
      setLiveCaption(null);
    }, 1200);
  }, []);

  // Unlock audio
  const handleUnlockAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setAudioUnlocked(true);
        triggerHighlight('play', 'Sound Enabled');
      } catch {
        setAudioUnlocked(false);
      }
    }
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      triggerHighlight('pause', 'Paused (Open Palm)');
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioUnlocked(true);
        triggerHighlight('play', 'Playing (Closed Fist)');
      }).catch(() => { });
    }
  }, [isPlaying, triggerHighlight]);

  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    triggerHighlight('next', 'Next Track (Swipe Right)');
  }, [playlist.length, triggerHighlight]);

  const handlePrevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    triggerHighlight('prev', 'Previous Track (Swipe Left)');
  }, [playlist.length, triggerHighlight]);

  const adjustVolume = useCallback((delta: number) => {
    setVolume((v) => {
      const next = stepVolume(v, delta);
      if (audioRef.current) audioRef.current.volume = next / 100;
      setSetting('media_volume', next);
      twoFingerTrackerRef.current?.setVolume(next / 100);
      triggerHighlight(delta > 0 ? 'volUp' : 'volDown', `Volume: ${next}%`);
      return next;
    });
  }, [triggerHighlight]);

  // Initialize TwoFingerVolumeTracker
  useEffect(() => {
    twoFingerTrackerRef.current = new TwoFingerVolumeTracker(volume / 100, {
      onVolumeChange: (vol, percent) => {
        setVolume(percent);
        if (audioRef.current) audioRef.current.volume = vol;
        triggerHighlight('volTwoFinger', `Volume ${percent}%`);
      },
      onModeExit: (_vol, percent) => {
        setSetting('media_volume', percent);
      },
    });
  }, [triggerHighlight]);

  // Real-time Two-Finger Volume detection loop (V sign held 300ms, relative vertical move, exit 450ms)
  useEffect(() => {
    let animId: number;
    const engine = MasterGestureEngine.getInstance();

    const loop = () => {
      const lms = engine.renderedLandmarks;
      const gesture = engine.state.filteredGesture;
      const now = Date.now();

      if (twoFingerTrackerRef.current) {
        const state = twoFingerTrackerRef.current.process(lms, gesture, now);
        if (state.isActive !== inDialMode) {
          setInDialMode(state.isActive);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [inDialMode]);

  // Gesture Subscriptions
  useEffect(() => {
    const unsubscribe = subscribe(({ action, gesture }) => {
      const now = Date.now();

      if (action === 'PLAY' || gesture === 'Closed_Fist') {
        if (!isPlaying && audioRef.current) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            setAudioUnlocked(true);
            triggerHighlight('play', 'Closed Fist: Play');
          }).catch(() => { });
        }
      } else if (action === 'PAUSE' || gesture === 'Open_Palm') {
        if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          triggerHighlight('pause', 'Open Palm: Pause');
        }
      } else if (action === 'VOLUME_UP' || gesture === 'Thumb_Up') {
        if (canRepeatVolumeStep(lastVolumeStepTimeRef.current, now, 400)) {
          adjustVolume(10);
          lastVolumeStepTimeRef.current = now;
        }
      } else if (action === 'VOLUME_DOWN' || gesture === 'Thumb_Down') {
        if (canRepeatVolumeStep(lastVolumeStepTimeRef.current, now, 400)) {
          adjustVolume(-10);
          lastVolumeStepTimeRef.current = now;
        }
      } else if (action === 'NEXT' || gesture === 'Swipe_Right') {
        handleNextTrack();
      } else if (action === 'PREV' || gesture === 'Swipe_Left') {
        handlePrevTrack();
      } else if (action === 'SCREENSHOT' || gesture === 'Victory') {
        captureSnapshot({ workspaceCanvas: canvasVisualizerRef.current }).then((res) => {
          if (res.success && res.filename) {
            triggerHighlight('victory', `Saved: ${res.filename}`);
          } else {
            triggerHighlight('victory', `Snapshot error: ${res.error || 'Failed'}`);
          }
        });
      }
    });

    return unsubscribe;
  }, [isPlaying, subscribe, adjustVolume, handleNextTrack, handlePrevTrack, triggerHighlight]);

  // Setup Web Audio Analyser for Visualizer
  useEffect(() => {
    if (!audioRef.current) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
        }
      }
    } catch { }
  }, []);

  // Visualizer Render Loop
  useEffect(() => {
    const canvas = canvasVisualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / 32) * 0.8;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        const val = isPlaying ? Math.max(12, dataArray[i] * 0.7) : 4;
        const barHeight = (val / 255) * canvas.height;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#1D63E8');
        grad.addColorStop(1, '#06B6D4');
        ctx.fillStyle = grad;

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 3;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Handle local user audio/video upload
  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newTrack: Track = {
        id: Math.random().toString(36).substring(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Media File',
        duration: 0,
        url,
        gradient: 'from-amber-600 to-rose-950',
      };
      setPlaylist([newTrack, ...playlist]);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onEnded={handleNextTrack}
      />

      {/* Unlock sound banner */}
      {!audioUnlocked && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-foreground">{t('media.enableSoundBanner', 'Click once to enable sound, then use gestures.')}</h4>
              <p className="text-[11px] text-muted">Browsers require an initial user click before audio plays touchlessly.</p>
            </div>
          </div>
          <button
            onClick={handleUnlockAudio}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-card shrink-0"
          >
            {t('media.enableSoundButton', 'Enable sound / Start session')}
          </button>
        </div>
      )}

      {/* Main Two-Column Media Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Real Audio Player */}
        <div className="lg:col-span-7 rounded-3xl bg-surface border border-border shadow-card p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Live Action Toast Banner */}
          {liveCaption && (
            <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-white font-heading font-bold text-xs shadow-elevated flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{liveCaption}</span>
            </div>
          )}

          {/* Cover Art Box with Visualizer */}
          <div className={`relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br ${currentTrack.gradient} p-6 flex flex-col justify-between text-white shadow-inner`}>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-xs text-[10px] font-mono tracking-wider uppercase">
                {t('mediaWorkspace.offlineTrack', 'Offline Track')}
              </span>
              <Disc className={`w-8 h-8 opacity-80 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>

            {/* Real Frequency Visualizer Canvas */}
            <div className="w-full h-20 flex items-end">
              <canvas ref={canvasVisualizerRef} width={400} height={80} className="w-full h-full object-cover" />
            </div>

            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-white">{currentTrack.title}</h2>
              <p className="text-xs text-white/70">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (currentTime / (currentTrack.duration || 30)) * 100)}%` }}
                className="h-full bg-primary transition-all duration-150"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>00:{Math.floor(currentTime) < 10 ? `0${Math.floor(currentTime)}` : Math.floor(currentTime)}</span>
              <span>00:{currentTrack.duration || 30}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevTrack}
                className={`p-3 rounded-2xl border transition-all ${activeHighlight === 'prev' ? 'bg-primary text-white scale-110 shadow-elevated' : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
                  }`}
                title={t('gestures.swipeLeft', 'Previous (Swipe Left)')}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className={`p-4 rounded-2xl border transition-all ${activeHighlight === 'play' || activeHighlight === 'pause'
                    ? 'bg-primary text-white scale-110 shadow-elevated'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-card'
                  }`}
                title={isPlaying ? t('gestures.openPalm', 'Pause (Open Palm)') : t('gestures.closedFist', 'Play (Closed Fist)')}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button
                onClick={handleNextTrack}
                className={`p-3 rounded-2xl border transition-all ${activeHighlight === 'next' ? 'bg-primary text-white scale-110 shadow-elevated' : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
                  }`}
                title={t('gestures.swipeRight', 'Next (Swipe Right)')}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button onClick={() => adjustVolume(-10)} className="text-muted hover:text-foreground" aria-label="Decrease volume">
                <VolumeX className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v / 100;
                  setSetting('media_volume', v);
                }}
                className="w-24 accent-primary"
                aria-label="Volume slider"
              />
              <button onClick={() => adjustVolume(10)} className="text-muted hover:text-foreground" aria-label="Increase volume">
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-muted w-8">{volume}%</span>
            </div>
          </div>

          {/* Vertical Volume Dial Overlay (Active during Two-Finger Volume Mode) */}
          {inDialMode && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-elevated animate-in fade-in zoom-in-95">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <div className="w-3.5 h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
                <div
                  style={{ height: `${volume}%` }}
                  className="w-full bg-cyan-400 rounded-full transition-all duration-75"
                />
              </div>
              <span className="font-mono font-bold text-xs text-white">{volume}%</span>
              <span className="text-[10px] tracking-wider text-cyan-300 font-semibold">
                {`Volume ${volume}%`}
              </span>
            </div>
          )}

          {/* Honest Note regarding web page vs Windows system volume */}
          <div className="pt-2 text-[11px] text-muted border-t border-border/60 flex items-start gap-2">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              {t(
                'modes.media.volumeNote',
                'Web browsers can only control this media player’s audio volume, not the Windows system volume (the Python desktop helper handles system-wide volume).'
              )}
            </span>
          </div>
        </div>

        {/* Right Column: Playlist & Docked Camera */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-foreground">{t('mediaWorkspace.offlinePlaylist', 'Offline Playlist')}</h3>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-secondary hover:bg-surface text-xs font-semibold text-foreground"
              >
                <FolderOpen className="w-3.5 h-3.5 text-accent" />
                <span>{t('mediaWorkspace.openFile', 'Open File')}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*,video/*" onChange={handleLocalFile} className="hidden" />
            </div>

            {/* Track Items */}
            <div className="space-y-2">
              {playlist.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                    if (audioRef.current) audioRef.current.play().catch(() => { });
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${idx === currentTrackIndex
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-soft'
                      : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-heading font-semibold">{track.title}</div>
                      <div className="text-[10px] text-muted">{track.artist}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted">00:{track.duration || 30}</span>
                </div>
              ))}
            </div>

            {/* Touchless Guide Card */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border text-xs space-y-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{t('practiceArena.gameControls', 'Gesture Controls')}</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted font-mono pt-1">
                <div>✊ {t('gestures.closedFist', 'Closed Fist')} → {t('gestures.closedFistAction', 'Play')}</div>
                <div>✋ {t('gestures.openPalm', 'Open Palm')} → {t('gestures.openPalmAction', 'Pause')}</div>
                <div>➡️ {t('gestures.swipeRight', 'Swipe Right')} → {t('mediaWorkspace.legendNext', 'Next')}</div>
                <div>⬅️ {t('gestures.swipeLeft', 'Swipe Left')} → {t('mediaWorkspace.legendPrev', 'Prev')}</div>
                <div>👍 {t('gestures.thumbUp', 'Thumb Up')} → {t('mediaWorkspace.legendVolUp', 'Vol +10%')}</div>
                <div>👎 {t('gestures.thumbDown', 'Thumb Down')} → {t('mediaWorkspace.legendVolDown', 'Vol -10%')}</div>
              </div>
            </div>
          </div>

          <PipCamera docked={true} />
        </div>
      </div>
    </div>
  );
};

export default MediaWorkspace;
