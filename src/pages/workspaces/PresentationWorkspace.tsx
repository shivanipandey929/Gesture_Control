import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Presentation,
  Sparkles,
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Maximize,
  Minimize,
  Clock,
  Edit3,
  Undo2,
  Trash2,
  Download,
} from 'lucide-react';
import { PipCamera } from '../../components/common/PipCamera';
import { useGesture } from '../../context/GestureContext';
import { getSetting, setSetting } from '../../db/db';
import { calculatePinchRatio } from '../../utils/volumeMapping';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Lazy loader for pdfjs-dist
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfLib, workerMod] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ]);
      pdfLib.GlobalWorkerOptions.workerSrc = workerMod.default;
      return pdfLib;
    })();
  }
  return pdfjsPromise;
}

interface DemoSlide {
  title: string;
  subtitle: string;
  badge: string;
  content: string;
  gradient: string;
}

export const PresentationWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { subscribe, setActiveMode } = useGesture();

  // Mode: 'demo' or 'pdf'
  const [deckMode, setDeckMode] = useState<'demo' | 'pdf'>('demo');

  // Demo slides state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // PDF slides state
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfPageNum, setPdfPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // Laser Pointer Coordinates (from Pointing Up index fingertip)
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const laserTimerRef = useRef<number | null>(null);

  // Presentation Pro Features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(10);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState('');
  const [isPenActive, setIsPenActive] = useState(false);
  const [strokes, setStrokes] = useState<{ points: { x: number; y: number }[]; color: string; size: number }[]>([]);
  const currentStrokeRef = useRef<{ points: { x: number; y: number }[]; color: string; size: number } | null>(null);
  const isPinchingRef = useRef<boolean>(false);
  const slideContainerRef = useRef<HTMLDivElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const demoSlides: DemoSlide[] = [
    {
      title: 'Touchless Interaction: The AI Paradigm',
      subtitle: 'Controlling computing without mechanical peripherals',
      badge: 'Architecture',
      content:
        'With neural vision networks running locally in WebAssembly, ordinary webcams deliver natural, low-latency spatial input for modern applications.',
      gradient: 'from-cyan-950/60 to-slate-900',
    },
    {
      title: 'Low-Latency 1€ Adaptive Smoothing',
      subtitle: 'Eliminating micro-tremors without introducing perceptible lag',
      badge: 'Core Engine',
      content:
        'The One-Euro filter dynamically adapts its cutoff frequency based on fingertip velocity, granting stable cursor hold and responsive high-speed flick recognition.',
      gradient: 'from-violet-950/60 to-slate-900',
    },
    {
      title: 'Zero-Cloud Absolute Data Privacy',
      subtitle: 'Your camera feed never touches an external server',
      badge: 'Security',
      content:
        'All landmark coordinates and gesture classifications are computed entirely on-chip inside the browser sandbox. Fully operational offline in airplane mode.',
      gradient: 'from-emerald-950/60 to-slate-900',
    },
    {
      title: 'Multi-Mode Spatial Workspaces',
      subtitle: 'Context-aware gestures tailored for every task',
      badge: 'Workspaces',
      content:
        'Switch seamlessly between presentation decks, media playback, reading auto-scroll, virtual cursor target practice, and hands-free kitchen recipes.',
      gradient: 'from-amber-950/60 to-slate-900',
    },
    {
      title: 'Accessible by Design',
      subtitle: 'Empowering motor-impaired and touchless users',
      badge: 'Inclusion',
      content:
        'Featuring dwell-click countdown rings, single-handed controls, adjustable sensitivity thresholds, and high-contrast modes for universal ergonomics.',
      gradient: 'from-sky-950/60 to-slate-900',
    },
  ];

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (deckMode === 'pdf' && pdfDoc) {
      setPdfPageNum((p) => Math.min(pdfTotalPages, p + 1));
    } else {
      setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
    }
  }, [deckMode, pdfDoc, pdfTotalPages, demoSlides.length]);

  const handlePrev = useCallback(() => {
    if (deckMode === 'pdf' && pdfDoc) {
      setPdfPageNum((p) => Math.max(1, p - 1));
    } else {
      setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
    }
  }, [deckMode, pdfDoc, demoSlides.length]);

  const togglePlay = useCallback((playState?: boolean) => {
    setIsPlaying((prev) => (playState !== undefined ? playState : !prev));
  }, []);

  // Subscribe to gesture actions
  useEffect(() => {
    setActiveMode('presentation');
    const unsubscribe = subscribe(({ action }) => {
      if (action === 'NEXT') {
        handleNext();
      } else if (action === 'PREV') {
        handlePrev();
      } else if (action === 'PAUSE') {
        setIsPlaying(false);
      } else if (action === 'PLAY') {
        setIsPlaying(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, setActiveMode, handleNext, handlePrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, togglePlay]);

  // Autoplay for demo slides
  useEffect(() => {
    if (!isPlaying || deckMode !== 'demo') return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, deckMode, demoSlides.length]);

  // Handle PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    setPdfFileName(file.name);

    try {
      const fileData = await file.arrayBuffer();
      const pdfLib = await getPdfjs();
      const loadingTask = pdfLib.getDocument({ data: fileData });
      const loadedDoc = await loadingTask.promise;

      setPdfDoc(loadedDoc);
      setPdfTotalPages(loadedDoc.numPages);
      setPdfPageNum(1);
      setDeckMode('pdf');

      // Generate thumbnails for the first 8 pages
      const thumbs: string[] = [];
      const maxThumbs = Math.min(loadedDoc.numPages, 10);
      for (let i = 1; i <= maxThumbs; i++) {
        const page = await loadedDoc.getPage(i);
        const vp = page.getViewport({ scale: 0.25 });
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = vp.width;
        thumbCanvas.height = vp.height;
        const ctx = thumbCanvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: vp } as Parameters<typeof page.render>[0]).promise;
          thumbs.push(thumbCanvas.toDataURL());
        }
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error('PDF parsing error:', err);
      alert('Failed to parse PDF document.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Render current PDF page to canvas
  useEffect(() => {
    if (deckMode !== 'pdf' || !pdfDoc || !pdfCanvasRef.current) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        const page = await pdfDoc!.getPage(pdfPageNum);
        if (isCancelled) return;

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale to fit viewport crisply
        const containerWidth = canvas.parentElement?.clientWidth || 960;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: Math.min(scale, 1.8) });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;
      } catch (err) {
        console.warn('PDF Page Render interrupted:', err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [deckMode, pdfDoc, pdfPageNum]);

  // Timer effect
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Notes persistence per slide
  const slideKey = deckMode === 'pdf' ? `slide_notes_pdf_${pdfPageNum}` : `slide_notes_demo_${currentSlide}`;

  useEffect(() => {
    getSetting<string>(slideKey, '').then((saved) => {
      setSpeakerNotes(saved || '');
    });
  }, [slideKey]);

  const handleNotesChange = (text: string) => {
    setSpeakerNotes(text);
    setSetting(slideKey, text);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      slideContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Redraw annotation canvas
  const redrawAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // Handle hand landmarks for laser pointer and drawing
  const handleLandmarks = useCallback(
    (landmarks: NormalizedLandmark[]) => {
      if (landmarks && landmarks.length > 8) {
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        // 1. Red Laser pointer (Pointing Up)
        if (!isPenActive && wrist.y - indexTip.y > 0.15) {
          setLaserPos({
            x: (1 - indexTip.x) * 100, // mirror X
            y: indexTip.y * 100,
          });

          if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
          laserTimerRef.current = window.setTimeout(() => {
            setLaserPos(null);
          }, 800);
        }

        // 2. Pinch pen drawing on slide
        if (isPenActive) {
          const ratio = calculatePinchRatio(landmarks);
          const canvas = annotationCanvasRef.current;
          if (canvas) {
            const x = (1 - indexTip.x) * canvas.width;
            const y = indexTip.y * canvas.height;

            if (ratio < 0.28) {
              if (!isPinchingRef.current) {
                isPinchingRef.current = true;
                currentStrokeRef.current = {
                  points: [{ x, y }],
                  color: '#EF4444',
                  size: 4,
                };
              } else if (currentStrokeRef.current) {
                currentStrokeRef.current.points.push({ x, y });
                const ctx = canvas.getContext('2d');
                if (ctx && currentStrokeRef.current.points.length > 1) {
                  const pts = currentStrokeRef.current.points;
                  ctx.beginPath();
                  ctx.strokeStyle = currentStrokeRef.current.color;
                  ctx.lineWidth = currentStrokeRef.current.size;
                  ctx.lineCap = 'round';
                  ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
                  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
                  ctx.stroke();
                }
              }
            } else {
              if (isPinchingRef.current && currentStrokeRef.current) {
                isPinchingRef.current = false;
                setStrokes((prev) => [...prev, currentStrokeRef.current!]);
                currentStrokeRef.current = null;
              }
            }
          }
        }
      }
    },
    [isPenActive]
  );

  const handleExportAnnotatedSlide = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (deckMode === 'pdf' && pdfCanvasRef.current) {
      ctx.drawImage(pdfCanvasRef.current, 0, 0, 1920, 1080);
    } else {
      const slide = demoSlides[currentSlide];
      const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1920, 1080);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(slide.badge.toUpperCase(), 120, 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(slide.title, 120, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '32px sans-serif';
      ctx.fillText(slide.subtitle, 120, 310);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px sans-serif';
      ctx.fillText(slide.content, 120, 420);
    }

    if (annotationCanvasRef.current) {
      ctx.drawImage(annotationCanvasRef.current, 0, 0, 1920, 1080);
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `AeroTouch_Slide_${activePage}_annotated.png`;
    a.click();
  };

  const totalPages = deckMode === 'pdf' ? pdfTotalPages : demoSlides.length;
  const activePage = deckMode === 'pdf' ? pdfPageNum : currentSlide + 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-foreground text-base">
              {deckMode === 'pdf' ? (pdfFileName || 'PDF Presentation') : t('presentationWorkspace.title', 'Touchless Presentation Workspace')}
            </h2>
            <p className="text-xs text-muted">
              {t('presentationWorkspace.slide', 'Slide')} {activePage} {t('presentationWorkspace.of', 'of')} {totalPages || 1} • {t('presentationWorkspace.desc', 'Swipe left or right to navigate slide presentations.')}
            </p>
          </div>
        </div>

        {/* Mode Switcher & Fallback Buttons */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-xs font-heading font-semibold text-foreground cursor-pointer transition-colors shadow-soft">
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>{isPdfLoading ? 'Uploading...' : t('presentationWorkspace.uploadDeck', 'Upload Presentation PDF')}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {deckMode === 'pdf' && (
            <button
              onClick={() => setDeckMode('demo')}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground text-xs font-heading font-semibold shadow-soft"
            >
              {t('presentationWorkspace.sampleDeck', 'Load Sample Pitch Deck')}
            </button>
          )}

          {deckMode === 'demo' && (
            <button
              onClick={() => togglePlay()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-heading transition-colors shadow-soft ${isPlaying
                ? 'bg-error/10 text-error border border-error/30'
                : 'bg-primary/10 text-primary border border-primary/30'
                }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? t('media.paused', 'Paused') : t('presentationWorkspace.nextSlide', 'Auto-advance')}</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={deckMode === 'pdf' && pdfPageNum <= 1}
              className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40 transition-colors shadow-soft"
              title={t('presentationWorkspace.prevSlide', 'Previous Slide')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={deckMode === 'pdf' && pdfPageNum >= pdfTotalPages}
              className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40 transition-colors shadow-soft"
              title={t('presentationWorkspace.nextSlide', 'Next Slide')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-heading font-semibold shadow-soft hover:bg-primary-hover transition-colors ml-1"
              title="Present Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? t('presentationWorkspace.exitPresent', 'Exit') : t('presentationWorkspace.present', 'Present')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Presentation Pro Toolbar (Timer & Annotation Pen) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl panel-card shadow-soft">
        {/* Slide Timer */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs text-foreground">
                {t('presentationWorkspace.slideTimer', 'Slide Timer:')}
              </span>
              <span className="font-mono font-bold text-xs text-primary">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} / {targetDurationMinutes}:00
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border text-foreground hover:bg-surface-secondary"
              >
                {isTimerRunning ? t('presentationWorkspace.pause', 'Pause') : t('presentationWorkspace.start', 'Start')}
              </button>
              <button
                onClick={() => {
                  setElapsedSeconds(0);
                  setIsTimerRunning(false);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border text-muted hover:text-foreground"
              >
                {t('common.reset', 'Reset')}
              </button>
              <select
                value={targetDurationMinutes}
                onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border text-foreground"
              >
                <option value={5}>{t('presentationWorkspace.targetMinutes', 'Target: {{mins}}m', { mins: 5 })}</option>
                <option value={10}>{t('presentationWorkspace.targetMinutes', 'Target: {{mins}}m', { mins: 10 })}</option>
                <option value={15}>{t('presentationWorkspace.targetMinutes', 'Target: {{mins}}m', { mins: 15 })}</option>
                <option value={20}>{t('presentationWorkspace.targetMinutes', 'Target: {{mins}}m', { mins: 20 })}</option>
              </select>
            </div>
            {/* Progress bar towards target minutes */}
            <div className="w-48 bg-surface-secondary border border-border h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${elapsedSeconds > targetDurationMinutes * 60 ? 'bg-rose-500' : 'bg-primary'
                  }`}
                style={{ width: `${Math.min(100, (elapsedSeconds / (targetDurationMinutes * 60)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Draw on Slide Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPenActive(!isPenActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-heading font-semibold transition-colors shadow-soft ${isPenActive
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-surface hover:bg-surface-secondary border-border text-foreground'
              }`}
            title="Draw with mouse or air pinch"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isPenActive ? 'Drawing: ON (Pinch / Drag)' : 'Draw on Slide'}</span>
          </button>

          {isPenActive && (
            <>
              <button
                onClick={() => setStrokes((s) => s.slice(0, -1))}
                disabled={strokes.length === 0}
                className="p-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground disabled:opacity-30"
                title="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setStrokes([])}
                disabled={strokes.length === 0}
                className="p-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-rose-500 disabled:opacity-30"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={handleExportAnnotatedSlide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-xs font-heading font-semibold text-foreground transition-colors shadow-soft"
            title="Export slide with drawings as PNG"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>{t('presentationWorkspace.exportSlidePng', 'Export Slide PNG')}</span>
          </button>
        </div>
      </div>

      {/* Main Slide Viewer / PDF Canvas */}
      <div
        ref={slideContainerRef}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-secondary border border-border flex flex-col justify-between p-8 sm:p-14 shadow-card select-none"
      >
        {deckMode === 'demo' ? (
          <>
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-mono text-xs uppercase px-3 py-1 rounded-full bg-surface border border-border text-foreground">
                {demoSlides[currentSlide].badge}
              </span>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {t('presentationWorkspace.slide', 'Slide')} {currentSlide + 1} {t('presentationWorkspace.of', 'of')} {demoSlides.length}
              </span>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-2xl space-y-4">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-foreground leading-tight">
                {demoSlides[currentSlide].title}
              </h1>
              <p className="text-base sm:text-xl font-medium text-foreground">
                {demoSlides[currentSlide].subtitle}
              </p>
              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
                {demoSlides[currentSlide].content}
              </p>
            </div>
          </>
        ) : (
          /* PDF Render Canvas */
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <canvas ref={pdfCanvasRef} className="max-w-full max-h-full object-contain rounded shadow-lg" />
          </div>
        )}

        {/* Annotation Canvas Overlay */}
        <canvas
          ref={annotationCanvasRef}
          width={1920}
          height={1080}
          className={`absolute inset-0 w-full h-full object-cover z-20 pointer-events-none ${isPenActive ? 'opacity-100' : 'opacity-80'
            }`}
        />

        {/* Red Laser Pointer overlay when pointing */}
        {laserPos && (
          <div
            style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-75"
          >
            <div className="w-5 h-5 rounded-full bg-rose-500/30 border border-rose-400 animate-ping absolute -inset-0" />
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white" />
          </div>
        )}

        {/* Bottom Progress Bar & Indicators */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="w-full bg-surface border border-border h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(activePage / (totalPages || 1)) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-mono text-[11px] text-primary font-medium">
              {t('presentationWorkspace.laserPointer', 'Virtual Laser Pointer')} (☝️)
            </span>
            <span className="font-mono text-[11px] text-muted">
              {t('presentationWorkspace.keysTip', 'Keys: ← / → or Space')}
            </span>
          </div>
        </div>
      </div>

      {/* PDF Thumbnails Strip (if PDF loaded) */}
      {deckMode === 'pdf' && thumbnails.length > 0 && (
        <div className="p-4 rounded-2xl panel-card shadow-soft space-y-2">
          <div className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Slide Thumbnails</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {thumbnails.map((thumbUrl, idx) => (
              <button
                key={idx}
                onClick={() => setPdfPageNum(idx + 1)}
                className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all ${pdfPageNum === idx + 1
                  ? 'border-primary shadow-card scale-105'
                  : 'border-border opacity-70 hover:opacity-100'
                  }`}
              >
                <img src={thumbUrl} alt={`Page ${idx + 1}`} className="w-24 h-16 object-cover" />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface/90 text-foreground border border-border">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Speaker Notes per Slide (Presentation Pro) */}
      <div className="p-4 rounded-2xl panel-card shadow-soft space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-heading font-bold text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span>{t('presentationWorkspace.speakerNotesTitle', 'Speaker Notes (Slide {{page}})', { page: activePage })}</span>
          </div>
          <span className="text-[10px] font-mono text-muted">{t('presentationWorkspace.autoSavedLocally', 'Auto-saved locally')}</span>
        </div>
        <textarea
          value={speakerNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={`Add your private speaker notes for slide ${activePage}...`}
          rows={3}
          className="w-full p-3 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed resize-y"
        />
      </div>

      {/* Presentation Gesture Guide */}
      <div className="p-4 rounded-2xl panel-card shadow-soft">
        <div className="flex items-center gap-2 mb-3 text-xs font-heading font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t('presentationWorkspace.title', 'Presentation Gesture Guide')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary flex items-center gap-1">
              <span>{t('gestures.swipeRight', 'Swipe Right')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-muted text-[11px]">{t('gestures.swipeRightAction', 'Next slide / page')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('gestures.swipeLeft', 'Swipe Left')}</span>
            </div>
            <div className="text-muted text-[11px]">{t('gestures.swipeLeftAction', 'Previous slide / page')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.pointingUp', 'Pointing Up')} ☝️</div>
            <div className="text-muted text-[11px]">{t('presentationWorkspace.laserPointer', 'Red laser pointer')}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <div className="font-mono font-bold text-primary">{t('gestures.closedFist', 'Closed Fist')} ✊</div>
            <div className="text-muted text-[11px]">{t('gestures.closedFistAction', 'Pause auto-advance')}</div>
          </div>
        </div>
      </div>

      <PipCamera onLandmarks={handleLandmarks} />
    </div>
  );
};
