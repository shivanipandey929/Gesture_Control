import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Camera,
  Play,
  Pause,
  Award,
  Heart,
  Volume2,
  VolumeX,
  Flame,
  History,
  Crosshair,
  Download,
  Eraser,
  HelpCircle,
  Undo2,
  Redo2,
  Trash2,
  MousePointer,
  ArrowLeft,
  Clock,
  Sparkles,
  Hand,
  CameraOff,
} from 'lucide-react';
import { useCamera } from '../context/CameraContext';
import { useGesture } from '../context/GestureContext';
import { useGestureEngine } from '../engine';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { sharedPointerMapper } from '../engine/pointerMapper';
import { voiceService } from '../services/voice';
import { db } from '../db/db';
import {
  AirDrawStateMachine,
  renderStroke,
  type DrawStroke,
  type StabilizerLevel,
  type PenTriggerMode,
} from './practice/AirDrawEngine';
import { PracticeLobbyVisual } from './practice/PracticeLobbyVisual';
import { PracticePopParticles, type PopEffect } from './practice/PracticePopParticles';

import { useTranslation } from 'react-i18next';
import { sfx } from './practice/ArcadeSoundFX';
import {
  type ArcadeTab,
  type Balloon,
  type Fruit,
  type JuiceParticle,
  type GameRecord,
  BALLOON_COLORS,
  FRUIT_TYPES,
  MATCH_GESTURES,
  AIR_DRAW_COLORS,
} from './practice/PracticeTypes';
import { PracticeRulesModal } from './practice/PracticeRulesModal';
import { PracticeCalibrationModal } from './practice/PracticeCalibrationModal';
import { PracticeGameOverModal } from './practice/PracticeGameOverModal';
import { PracticeHistoryTable } from './practice/PracticeHistoryTable';
import { RpsGame } from './practice/RpsGame';
import { FingerCountGame } from './practice/FingerCountGame';

export const Practice: React.FC = () => {
  const { t } = useTranslation();
  const { isStreaming, startCamera, stopCamera, stream } = useCamera();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab isolation: URL query ?game=... takes precedence, fallback to localStorage
  const [activeTab, setActiveTabState] = useState<ArcadeTab>(() => {
    const fromUrl = searchParams.get('game');
    if (fromUrl === 'fruit' || fromUrl === 'fruit-slash') return 'fruit';
    if (fromUrl === 'match' || fromUrl === 'gesture-match') return 'match';
    if (fromUrl === 'draw' || fromUrl === 'air-draw') return 'draw';
    if (fromUrl === 'balloon' || fromUrl === 'balloon-pop') return 'balloon';
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('aerotouch_practice_tab') : null;
    if (saved === 'fruit' || saved === 'match' || saved === 'draw' || saved === 'balloon') {
      return saved as ArcadeTab;
    }
    return 'balloon';
  });

  const setActiveTab = (tab: ArcadeTab) => {
    setActiveTabState(tab);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aerotouch_practice_tab', tab);
    }
    setSearchParams({ game: tab });
    voiceService.speakPhrase('next');
  };

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'paused' | 'gameover'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => voiceService.isEnabled);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  useEffect(() => {
    return voiceService.subscribe((enabled) => setVoiceEnabled(enabled));
  }, []);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrateStep, setCalibrateStep] = useState<number>(0);
  const [showRulesOverlay, setShowRulesOverlay] = useState<boolean>(false);
  const [rulesCardOpen, setRulesCardOpen] = useState<boolean>(false);
  const [playWithMouse, setPlayWithMouse] = useState<boolean>(false);
  const [arMode, setArMode] = useState<boolean>(false);

  const { setActiveMode } = useGesture();
  // While a Practice tab is active, disable global SCREENSHOT, volume and click actions
  useEffect(() => {
    setActiveMode('practice');
    return () => {
      setActiveMode('general');
    };
  }, [setActiveMode]);

  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [successfulHits, setSuccessfulHits] = useState(0);

  // Video and skeleton canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      if (stream && isStreaming) {
        if (node.srcObject !== stream) {
          node.srcObject = stream;
        }
        node.play().catch(() => { });
      } else {
        node.srcObject = null;
      }
    }
  }, [stream, isStreaming]);

  const sideCameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Callback ref for small Camera View card: attach shared stream on mount & stream changes
  const setSideCameraVideoRef = useCallback((node: HTMLVideoElement | null) => {
    sideCameraVideoRef.current = node;
    if (node) {
      if (stream && isStreaming) {
        if (node.srcObject !== stream) {
          node.srcObject = stream;
        }
        node.play().catch(() => { });
      } else {
        node.srcObject = null;
      }
    }
  }, [stream, isStreaming]);

  useEffect(() => {
    if (videoRef.current) {
      if (stream && isStreaming) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.srcObject = null;
      }
    }
    if (sideCameraVideoRef.current) {
      if (stream && isStreaming) {
        if (sideCameraVideoRef.current.srcObject !== stream) {
          sideCameraVideoRef.current.srcObject = stream;
        }
        sideCameraVideoRef.current.play().catch(() => { });
      } else {
        sideCameraVideoRef.current.srcObject = null;
      }
    }
  }, [stream, isStreaming]);

  // History & High scores
  const [history, setHistory] = useState<GameRecord[]>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_arcade_history');
      if (saved) return JSON.parse(saved);
      // Sample sessions matching reference if history is fresh
      return [
        { id: 'h1', timestamp: Date.now() - 1000 * 60 * 14, game: 'fruit', score: 1000, accuracy: 90, difficulty: 'medium', result: 'completed' },
        { id: 'h2', timestamp: Date.now() - 1000 * 60 * 25, game: 'fruit', score: 1000, accuracy: 90, difficulty: 'medium', result: 'completed' },
        { id: 'h3', timestamp: Date.now() - 1000 * 60 * 42, game: 'match', score: 710, accuracy: 60, difficulty: 'medium', result: 'completed' },
        { id: 'h4', timestamp: Date.now() - 1000 * 60 * 58, game: 'match', score: 710, accuracy: 60, difficulty: 'medium', result: 'completed' },
      ];
    } catch {
      return [];
    }
  });

  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_arcade_bests');
      return saved ? JSON.parse(saved) : { balloon: 0, fruit: 0, match: 0, draw: 0 };
    } catch {
      return { balloon: 0, fruit: 0, match: 0, draw: 0 };
    }
  });

  // Arena & Pointer Tracking
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; isVisible: boolean; isPinching: boolean }>({
    x: 50,
    y: 50,
    isVisible: false,
    isPinching: false,
  });

  const [bladeTrail, setBladeTrail] = useState<{ x: number; y: number; time: number }[]>([]);

  // BALLOON POP STATE
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const nextBalloonIdRef = useRef(1);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);

  const triggerPopEffect = useCallback((x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setPopEffects((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setPopEffects((prev) => prev.filter((p) => p.id !== id));
    }, 700);
  }, []);

  // FRUIT SLASH STATE
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [juiceParticles, setJuiceParticles] = useState<JuiceParticle[]>([]);
  const nextFruitIdRef = useRef(1);
  const nextParticleIdRef = useRef(1);

  // GESTURE MATCH STATE
  const [matchRound, setMatchRound] = useState<number>(1);
  const [currentTargetGesture, setCurrentTargetGesture] = useState(MATCH_GESTURES[0]);
  const [matchRoundTimeLeft, setMatchRoundTimeLeft] = useState<number>(4.0);
  const [gestureReactionTimes, setGestureReactionTimes] = useState<Record<string, number[]>>({});
  const roundStartTimeRef = useRef<number>(Date.now());

  // AIR DRAW STATE & STATE MACHINE
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [airDrawSm] = useState(() => new AirDrawStateMachine('pointing', 'medium'));
  const [penMode, setPenMode] = useState<PenTriggerMode>('pointing');
  const [stabilizer, setStabilizer] = useState<StabilizerLevel>('medium');
  const [isPenDown, setIsPenDown] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#1D63E8');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawStroke[]>([]);
  const currentStrokeRef = useRef<DrawStroke | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [hasDrawnFirstStroke, setHasDrawnFirstStroke] = useState<boolean>(false);
  const [freshHandDetected, setFreshHandDetected] = useState<boolean>(false);
  const lastHandTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

  // Debug HUD state (toggled with Shift+D)
  const [debugHudOpen, setDebugHudOpen] = useState<boolean>(true);
  const [hudData, setHudData] = useState({
    hasHand: false,
    pointerX: 0,
    pointerY: 0,
    pinchRatio: 0,
    pinchThreshold: 0.30,
    isPenDown: false,
    gesture: 'None',
  });

  // Dynamic refs for 60fps RAF loop to avoid recreation on state changes
  const brushColorRef = useRef(brushColor);
  brushColorRef.current = brushColor;
  const brushSizeRef = useRef(brushSize);
  brushSizeRef.current = brushSize;
  const isEraserRef = useRef(isEraser);
  isEraserRef.current = isEraser;
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;

  // Pause gesture tracking (Open_Palm held 800ms)
  const openPalmHoldStartRef = useRef<number | null>(null);

  // Closed_Fist hold for Eraser toggle (600ms)
  const fistHoldStartRef = useRef<number | null>(null);

  // Victory hold for color cycle in Air Draw (400ms)
  const victoryHoldStartRef = useRef<number | null>(null);

  // Single shared engine hook
  const { state: engineState, getLandmarks } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: true,
  });

  useEffect(() => {
    sfx.muted = isMuted;
  }, [isMuted]);

  // Sync stabilizer and penMode with AirDraw state machine
  useEffect(() => {
    airDrawSm.penMode = penMode;
    airDrawSm.setStabilizer(stabilizer);
  }, [penMode, stabilizer, airDrawSm]);

  // Mouse fallback handler for arena
  const handleArenaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playWithMouse || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setPointer({
      x,
      y,
      isVisible: true,
      isPinching: e.buttons === 1,
    });
  };

  // Open_Palm pause gesture & Closed_Fist eraser toggle
  useEffect(() => {
    const now = Date.now();
    // 1. Open_Palm held for 800ms -> Pause/Resume
    if (engineState.filteredGesture === 'Open_Palm') {
      if (!openPalmHoldStartRef.current) {
        openPalmHoldStartRef.current = now;
      } else if (now - openPalmHoldStartRef.current >= 800) {
        openPalmHoldStartRef.current = now + 1000; // debounce
        if (gameState === 'playing') {
          setGameState('paused');
          voiceService.speakPhrase('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
          voiceService.speakPhrase('play');
        }
      }
    } else {
      openPalmHoldStartRef.current = null;
    }

    // 2. Closed_Fist held 600ms -> Toggle Eraser in Air Draw
    if (activeTab === 'draw' && engineState.filteredGesture === 'Closed_Fist') {
      if (!fistHoldStartRef.current) {
        fistHoldStartRef.current = now;
      } else if (now - fistHoldStartRef.current >= 600) {
        fistHoldStartRef.current = now + 1200;
        setIsEraser((prev) => !prev);
      }
    } else {
      fistHoldStartRef.current = null;
    }

    // 3. Victory held 400ms -> Cycle brush color in Air Draw (no screenshots)
    if (activeTab === 'draw' && engineState.filteredGesture === 'Victory') {
      if (!victoryHoldStartRef.current) {
        victoryHoldStartRef.current = now;
      } else if (now - victoryHoldStartRef.current >= 400) {
        victoryHoldStartRef.current = now + 700; // debounce
        setBrushColor((prev) => {
          const idx = AIR_DRAW_COLORS.indexOf(prev);
          const nextIdx = (idx + 1) % AIR_DRAW_COLORS.length;
          return AIR_DRAW_COLORS[nextIdx];
        });
        setIsEraser(false);
      }
    } else {
      victoryHoldStartRef.current = null;
    }
  }, [engineState.filteredGesture, gameState, activeTab]);

  // Redraw Air Draw canvases with DPR support
  const redrawAirDrawCanvases = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of strokes) {
      renderStroke(ctx, stroke);
    }
    if (currentStrokeRef.current) {
      renderStroke(ctx, currentStrokeRef.current);
    }
    ctx.restore();
  }, [strokes]);

  useEffect(() => {
    redrawAirDrawCanvases();
  }, [redrawAirDrawCanvases]);

  // Synchronize canvas backing dimensions with arena client size and DPR
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = arena.clientWidth || 720;
      const h = arena.clientHeight || 540;
      if (w > 0 && h > 0) {
        const targetW = Math.round(w * dpr);
        const targetH = Math.round(h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          redrawAirDrawCanvases();
        }
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(arena);
    return () => ro.disconnect();
  }, [activeTab, redrawAirDrawCanvases]);

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, last]);
  }, [strokes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setStrokes((s) => [...s, next]);
  }, [redoStack]);

  const handleClearStrokes = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    setClearConfirmOpen(false);
  }, []);

  const handleSavePng = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `aerotouch-airdraw-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Test canvas handler: draws an immediate smooth arc to verify canvas rendering
  const handleDrawTestStroke = useCallback(() => {
    const arena = arenaRef.current;
    const w = arena?.clientWidth || 720;
    const h = arena?.clientHeight || 540;

    const points = [];
    const startX = w * 0.25;
    const endX = w * 0.75;
    const centerY = h * 0.5;
    const now = Date.now();
    for (let i = 0; i <= 30; i++) {
      const tVal = i / 30;
      const px = startX + tVal * (endX - startX);
      const py = centerY + Math.sin(tVal * Math.PI) * -80;
      points.push({ x: px, y: py, time: now + i * 10 });
    }

    const testStroke: DrawStroke = {
      id: `test-${Date.now()}`,
      points,
      color: brushColorRef.current,
      size: Math.max(6, brushSizeRef.current),
      isEraser: false,
    };

    setStrokes((s) => [...s, testStroke]);
    setRedoStack([]);
    setHasDrawnFirstStroke(true);
    sfx.playMatchSuccess();
  }, []);

  // Mouse / Pointer fallback drawing handlers on canvas
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isMouseDownRef.current = true;
    setIsPenDown(true);

    currentStrokeRef.current = {
      id: Math.random().toString(36).substring(2, 9),
      points: [{ x, y, time: Date.now() }],
      color: brushColorRef.current,
      size: brushSizeRef.current,
      isEraser: isEraserRef.current,
    };
    redrawAirDrawCanvases();
  }, [redrawAirDrawCanvases]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !currentStrokeRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.points.push({ x, y, time: Date.now() });
    redrawAirDrawCanvases();
  }, [redrawAirDrawCanvases]);

  const handleCanvasPointerUp = useCallback(() => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsPenDown(false);
    if (currentStrokeRef.current) {
      const finished = currentStrokeRef.current;
      currentStrokeRef.current = null;
      if (finished.points.length > 0) {
        setStrokes((s) => [...s, finished]);
        setRedoStack([]);
        setHasDrawnFirstStroke(true);
      }
      redrawAirDrawCanvases();
    }
  }, [redrawAirDrawCanvases]);

  // Keyboard shortcuts (Undo/Redo & Shift+D HUD toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setDebugHudOpen((prev) => !prev);
        return;
      }

      if (activeTab === 'draw') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleUndo, handleRedo]);

  // Continuous 60 FPS Pointer & Air Draw update loop
  useEffect(() => {
    let active = true;
    let animId: number;

    const loop = () => {
      if (!active) return;
      const now = Date.now();
      const lms = getLandmarks();
      const hasValidHand = !!(lms && lms.length === 21);

      if (hasValidHand) {
        lastHandTimeRef.current = now;
      }

      const isFresh = hasValidHand && (now - lastHandTimeRef.current <= 400);
      setFreshHandDetected(isFresh);

      const arena = arenaRef.current;
      const boxW = arena?.clientWidth || 720;
      const boxH = arena?.clientHeight || 540;
      const vw = videoRef.current?.videoWidth || 640;
      const vh = videoRef.current?.videoHeight || 480;

      let pX = 0;
      let pY = 0;
      let pIsPinching = false;

      if (isFresh && lms) {
        const p = sharedPointerMapper.process(lms, {
          boxWidth: boxW,
          boxHeight: boxH,
          videoWidth: vw,
          videoHeight: vh,
          objectFit: 'cover',
        });

        pX = p.pixelX ?? (p.x / 100) * boxW;
        pY = p.pixelY ?? (p.y / 100) * boxH;
        pIsPinching = p.isPinching;

        if (!playWithMouse) {
          setPointer(p);
        }

        const currP = playWithMouse ? pointerRef.current : p;
        setBladeTrail((prev) => {
          const next = [...prev, { x: currP.x, y: currP.y, time: now }];
          return next.filter((pt) => now - pt.time <= 150);
        });
      } else {
        if (!playWithMouse) {
          setPointer((prev) => (prev.isVisible ? { ...prev, isVisible: false } : prev));
        }
      }

      // Air Draw frame processing
      if (activeTab === 'draw') {
        const updateRes = airDrawSm.update(
          isFresh ? lms : null,
          isFresh ? engineState.filteredGesture : undefined,
          boxW,
          boxH,
          now,
          pX,
          pY
        );

        setIsPenDown(updateRes.isPenDown);

        if (updateRes.strokeEnded && currentStrokeRef.current) {
          const finished = currentStrokeRef.current;
          currentStrokeRef.current = null;
          if (finished.points.length > 0) {
            setStrokes((s) => [...s, finished]);
            setRedoStack([]);
            setHasDrawnFirstStroke(true);
          }
        }

        if (updateRes.newPoint) {
          if (!currentStrokeRef.current) {
            currentStrokeRef.current = {
              id: Math.random().toString(36).substring(2, 9),
              points: [updateRes.newPoint],
              color: brushColorRef.current,
              size: brushSizeRef.current,
              isEraser: isEraserRef.current,
            };
          } else {
            currentStrokeRef.current.points.push(updateRes.newPoint);
          }
          redrawAirDrawCanvases();
        }

        setHudData({
          hasHand: isFresh,
          pointerX: Math.round(pX),
          pointerY: Math.round(pY),
          pinchRatio: updateRes.pinchRatio,
          pinchThreshold: updateRes.pinchThreshold,
          isPenDown: updateRes.isPenDown,
          gesture: isFresh ? (engineState.filteredGesture || 'None') : 'None',
        });
      } else {
        setHudData({
          hasHand: isFresh,
          pointerX: Math.round(pX),
          pointerY: Math.round(pY),
          pinchRatio: airDrawSm.currentPinchRatio,
          pinchThreshold: airDrawSm.PINCH_START,
          isPenDown: pIsPinching,
          gesture: isFresh ? (engineState.filteredGesture || 'None') : 'None',
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [getLandmarks, playWithMouse, activeTab, airDrawSm, engineState.filteredGesture, redrawAirDrawCanvases]);

  // Combo multiplier calculation
  const comboMultiplier = streak >= 12 ? 4 : streak >= 8 ? 3 : streak >= 4 ? 2 : 1;

  // Handle Game Over
  const handleGameOver = useCallback(
    (result: 'completed' | 'failed') => {
      setGameState('gameover');
      voiceService.speakPhrase('gameover');
      const finalScore = score;
      const acc = totalAttempts > 0 ? Math.round((successfulHits / totalAttempts) * 100) : 100;

      // Update best score
      setBestScores((prev) => {
        const cur = prev[activeTab] || 0;
        if (finalScore > cur) {
          const next = { ...prev, [activeTab]: finalScore };
          localStorage.setItem('aerotouch_arcade_bests', JSON.stringify(next));
          return next;
        }
        return prev;
      });

      // Append history record
      const rec: GameRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        game: activeTab,
        score: finalScore,
        accuracy: acc,
        difficulty,
        result,
      };

      setHistory((prev) => {
        const next = [rec, ...prev.slice(0, 9)];
        try {
          localStorage.setItem('aerotouch_arcade_history', JSON.stringify(next));
        } catch { }
        db.settings
          .put({
            key: 'arcade_game_history',
            value: next,
            synced: false,
            updatedAt: Date.now(),
          })
          .catch(() => { });
        return next;
      });
    },
    [score, totalAttempts, successfulHits, activeTab, difficulty]
  );

  // Countdown and Start Game
  const startGame = useCallback(async () => {
    if (!isStreaming && !playWithMouse) {
      await startCamera();
    }
    setScore(0);
    setTotalAttempts(0);
    setSuccessfulHits(0);
    setLives(3);
    setStreak(0);
    setTimeLeft(60);
    setBalloons([]);
    setFruits([]);
    setJuiceParticles([]);
    setMatchRound(1);
    setMatchRoundTimeLeft(4.0);
    setGestureReactionTimes({});
    setShowRulesOverlay(false);
    voiceService.speakPhrase('play');

    if (activeTab === 'draw') {
      setGameState('playing');
    } else {
      setGameState('countdown');
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            setGameState('playing');
            roundStartTimeRef.current = Date.now();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  }, [isStreaming, playWithMouse, startCamera, activeTab]);

  // Global Shortcuts: Space, R, 1/2/3, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') {
          startGame();
        } else if (gameState === 'playing') {
          setGameState('paused');
          voiceService.speakPhrase('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
          voiceService.speakPhrase('play');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') {
          startGame();
        }
      } else if (e.key === '1') {
        setDifficulty('easy');
      } else if (e.key === '2') {
        setDifficulty('medium');
      } else if (e.key === '3') {
        setDifficulty('hard');
      } else if (e.key === 'Escape') {
        if (gameState !== 'idle') {
          setGameState('idle');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  // 60-Second Match Countdown
  useEffect(() => {
    if (gameState !== 'playing' || activeTab === 'draw') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleGameOver('completed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, activeTab, handleGameOver]);

  // Lives check
  useEffect(() => {
    if (gameState === 'playing' && lives <= 0 && activeTab !== 'draw') {
      handleGameOver('failed');
    }
  }, [lives, gameState, activeTab, handleGameOver]);

  // 1. BALLOON POP ENGINE: Spawns across full arena width
  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'balloon') return;

    const spawnInterval = difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 850 : 550;
    const interval = setInterval(() => {
      setBalloons((prev) => {
        if (prev.length >= 8) return prev;
        const roll = Math.random();
        const type: 'standard' | 'gold' | 'bomb' | 'clock' =
          roll < 0.15 ? 'bomb' : roll < 0.25 ? 'gold' : roll < 0.35 ? 'clock' : 'standard';

        const color =
          type === 'bomb'
            ? '#EF4444'
            : type === 'gold'
              ? '#F59E0B'
              : type === 'clock'
                ? '#0EA5E9'
                : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

        const newBalloon: Balloon = {
          id: nextBalloonIdRef.current++,
          x: Math.random() * 80 + 10,
          y: 110,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(Math.random() * 0.4 + (difficulty === 'easy' ? 0.45 : difficulty === 'medium' ? 0.7 : 1.0)),
          radius: type === 'bomb' ? 26 : type === 'gold' ? 24 : 28,
          color,
          type,
          popped: false,
        };
        return [...prev, newBalloon];
      });
    }, spawnInterval);

    return () => clearInterval(interval);
  }, [gameState, activeTab, difficulty]);

  // Balloon Pop Collision & Physics Loop
  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'balloon') return;

    let animId: number;
    const loop = () => {
      const now = Date.now();
      setBalloons((prev) =>
        prev
          .map((b) => {
            if (b.popped) return b;
            const newX = b.x + b.vx;
            const newY = b.y + b.vy;

            if (pointer.isVisible) {
              const dist = Math.hypot(b.x - pointer.x, b.y - pointer.y);
              // Pop by 300ms hover OR pinch
              if (dist <= 8) {
                const hoverTime = b.hoverStartTime || now;
                const isHoverPop = now - hoverTime >= 300;
                const isPinchPop = pointer.isPinching;

                if (isHoverPop || isPinchPop) {
                  setTotalAttempts((ta) => ta + 1);
                  if (b.type === 'bomb') {
                    sfx.playBomb();
                    setLives((l) => Math.max(0, l - 1));
                    setStreak(0);
                    setScreenShake(true);
                    triggerPopEffect(b.x, b.y, '-1 Heart', '#EF4444');
                    setTimeout(() => setScreenShake(false), 400);
                  } else {
                    setSuccessfulHits((sh) => sh + 1);
                    setStreak((st) => st + 1);
                    let pts = 10;
                    let text = `+${10 * comboMultiplier}`;
                    let effColor = b.color;
                    if (b.type === 'gold') {
                      pts = 50;
                      text = `+${50 * comboMultiplier} ⭐`;
                      effColor = '#F59E0B';
                    }
                    if (b.type === 'clock') {
                      setTimeLeft((t) => t + 5);
                      pts = 15;
                      text = '+5s ⏱️';
                      effColor = '#0EA5E9';
                    }
                    setScore((s) => s + pts * comboMultiplier);
                    sfx.playPop(comboMultiplier);
                    voiceService.speakPhrase('pop');
                    triggerPopEffect(b.x, b.y, text, effColor);
                  }
                  return { ...b, popped: true };
                }
                return { ...b, x: newX, y: newY, hoverStartTime: hoverTime };
              }
            }
            return { ...b, x: newX, y: newY, hoverStartTime: undefined };
          })
          .filter((b) => !b.popped && b.x >= -10 && b.x <= 110 && b.y >= -15 && b.y <= 115)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeTab, pointer, comboMultiplier, triggerPopEffect]);

  // 2. FRUIT SLASH ENGINE: Realistic physics projectile arcs & splitting slices
  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'fruit') return;

    const spawnDelay = difficulty === 'easy' ? 1400 : difficulty === 'medium' ? 1000 : 700;
    const interval = setInterval(() => {
      setFruits((prev) => {
        if (prev.length >= 6) return prev;
        const isBombRoll = Math.random() < 0.2;
        const template = isBombRoll
          ? FRUIT_TYPES[FRUIT_TYPES.length - 1]
          : FRUIT_TYPES[Math.floor(Math.random() * (FRUIT_TYPES.length - 1))];

        const launchFromLeft = Math.random() < 0.5;
        const startX = launchFromLeft ? Math.random() * 20 + 5 : Math.random() * 20 + 75;
        const targetVx = launchFromLeft ? Math.random() * 0.45 + 0.35 : -(Math.random() * 0.45 + 0.35);

        const newFruit: Fruit = {
          id: nextFruitIdRef.current++,
          name: template.name,
          emoji: template.emoji,
          color: template.color,
          x: startX,
          y: 110,
          vx: targetVx,
          vy: -(Math.random() * 0.4 + 1.8),
          radius: template.radius,
          isBomb: template.isBomb,
          slashed: false,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 8,
        };
        return [...prev, newFruit];
      });
    }, spawnDelay);

    return () => clearInterval(interval);
  }, [gameState, activeTab, difficulty]);

  // Fruit Physics, Slicing & Juice Particles Loop
  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'fruit') return;

    let animId: number;
    const gravity = 0.045;

    const loop = () => {
      setFruits((prev) =>
        prev
          .map((f) => {
            if (f.slashed && f.halves) {
              return {
                ...f,
                halves: {
                  ...f.halves,
                  leftX: f.halves.leftX - f.halves.vxLeft,
                  leftY: f.halves.leftY + 1.5,
                  rightX: f.halves.rightX + f.halves.vxRight,
                  rightY: f.halves.rightY + 1.5,
                },
                rotation: f.rotation + f.rotSpeed,
              };
            }

            const newX = f.x + f.vx;
            const newVy = f.vy + gravity;
            const newY = f.y + newVy;

            // Check slicing collision with pointer blade
            if (pointer.isVisible && !f.slashed) {
              const dist = Math.hypot(f.x - pointer.x, f.y - pointer.y);
              if (dist <= 10) {
                setTotalAttempts((ta) => ta + 1);
                if (f.isBomb) {
                  sfx.playBomb();
                  setLives((l) => Math.max(0, l - 1));
                  setStreak(0);
                  setScreenShake(true);
                  triggerPopEffect(f.x, f.y, '-1 Heart 💣', '#EF4444');
                  setTimeout(() => setScreenShake(false), 400);
                  return { ...f, slashed: true };
                } else {
                  sfx.playSlash();
                  voiceService.speakPhrase('slash');
                  setSuccessfulHits((sh) => sh + 1);
                  setStreak((st) => st + 1);
                  setScore((s) => s + 15 * comboMultiplier);
                  triggerPopEffect(f.x, f.y, `+${15 * comboMultiplier}`, f.color);

                  // Spawn juice splash particles
                  for (let i = 0; i < 6; i++) {
                    setJuiceParticles((jps) => [
                      ...jps,
                      {
                        id: nextParticleIdRef.current++,
                        x: f.x,
                        y: f.y,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: (Math.random() - 0.5) * 1.5,
                        color: f.color,
                        size: Math.random() * 8 + 4,
                        alpha: 1,
                      },
                    ]);
                  }

                  return {
                    ...f,
                    slashed: true,
                    halves: {
                      leftX: f.x - 2,
                      leftY: f.y,
                      rightX: f.x + 2,
                      rightY: f.y,
                      vxLeft: 0.8,
                      vxRight: 0.8,
                    },
                  };
                }
              }
            }

            // Dropped uncut fruit penalty in medium/hard
            if (!f.slashed && newY > 115 && newVy > 0 && !f.isBomb && difficulty !== 'easy') {
              setLives((l) => Math.max(0, l - 1));
              setStreak(0);
            }

            return {
              ...f,
              x: newX,
              y: newY,
              vy: newVy,
              rotation: f.rotation + f.rotSpeed,
            };
          })
          .filter((f) => f.y <= 125 && f.x >= -15 && f.x <= 115)
      );

      // Update juice particles
      setJuiceParticles((prev) =>
        prev
          .map((jp) => ({
            ...jp,
            x: jp.x + jp.vx,
            y: jp.y + jp.vy,
            alpha: jp.alpha - 0.04,
          }))
          .filter((jp) => jp.alpha > 0)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeTab, pointer, difficulty, comboMultiplier, triggerPopEffect]);

  // 3. GESTURE MATCH ENGINE
  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'match') return;

    const roundDuration = difficulty === 'easy' ? 5.0 : difficulty === 'medium' ? 4.0 : 3.0;

    const interval = setInterval(() => {
      setMatchRoundTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time expired for this gesture
          setLives((l) => Math.max(0, l - 1));
          setStreak(0);
          setTotalAttempts((ta) => ta + 1);

          if (matchRound >= 10) {
            handleGameOver('completed');
            return 0;
          } else {
            setMatchRound((r) => r + 1);
            setCurrentTargetGesture(MATCH_GESTURES[Math.floor(Math.random() * MATCH_GESTURES.length)]);
            roundStartTimeRef.current = Date.now();
            return roundDuration;
          }
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, activeTab, matchRound, difficulty, handleGameOver]);

  useEffect(() => {
    if (gameState !== 'playing' || activeTab !== 'match') return;

    if (engineState.filteredGesture === currentTargetGesture.name) {
      const reactionTime = Date.now() - roundStartTimeRef.current;
      sfx.playMatchSuccess();
      setScore((s) => s + 100 + Math.max(0, Math.round((matchRoundTimeLeft / 4) * 50)));
      setSuccessfulHits((sh) => sh + 1);
      setTotalAttempts((ta) => ta + 1);
      setStreak((st) => st + 1);

      setGestureReactionTimes((prev) => ({
        ...prev,
        [currentTargetGesture.name]: [...(prev[currentTargetGesture.name] || []), reactionTime],
      }));

      if (matchRound >= 10) {
        handleGameOver('completed');
      } else {
        setMatchRound((r) => r + 1);
        setCurrentTargetGesture(MATCH_GESTURES[Math.floor(Math.random() * MATCH_GESTURES.length)]);
        roundStartTimeRef.current = Date.now();
        setMatchRoundTimeLeft(difficulty === 'easy' ? 5.0 : difficulty === 'medium' ? 4.0 : 3.0);
      }
    }
  }, [engineState.filteredGesture, currentTargetGesture, gameState, activeTab, matchRound, matchRoundTimeLeft, difficulty, handleGameOver]);

  // Compute hardest gesture
  const getHardestGesture = () => {
    let hardest = 'Open Palm';
    let maxAvg = 0;
    for (const [g, times] of Object.entries(gestureReactionTimes)) {
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        if (avg > maxAvg) {
          maxAvg = avg;
          hardest = g.replace('_', ' ');
        }
      }
    }
    return hardest;
  };

  // 4-corner calibration
  const recordCalibrationPoint = (corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    const lms = getLandmarks();
    if (lms && lms.length >= 21) {
      const rawMirroredX = 1 - lms[8].x;
      const rawY = lms[8].y;
      const curCal = sharedPointerMapper.getCalibration();

      if (corner === 'topLeft') {
        curCal.minX = rawMirroredX;
        curCal.minY = rawY;
        setCalibrateStep(1);
      } else if (corner === 'topRight') {
        curCal.maxX = rawMirroredX;
        curCal.minY = Math.min(curCal.minY, rawY);
        setCalibrateStep(2);
      } else if (corner === 'bottomRight') {
        curCal.maxX = Math.max(curCal.maxX, rawMirroredX);
        curCal.maxY = rawY;
        setCalibrateStep(3);
      } else if (corner === 'bottomLeft') {
        curCal.minX = Math.min(curCal.minX, rawMirroredX);
        curCal.maxY = Math.max(curCal.maxY, rawY);
        sharedPointerMapper.setCalibration(curCal);
        setIsCalibrating(false);
      }
    }
  };

  const isPlayingMode = gameState === 'playing' || gameState === 'countdown' || gameState === 'paused' || gameState === 'gameover';

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 sm:py-7 flex flex-col gap-5 min-h-[calc(100vh-4rem)] select-none font-body">
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR: Brand, 4 Arcade Tabs & Actions         */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Heading or In-Game Back Pill */}
        <div className="flex items-center gap-3">
          {isPlayingMode ? (
            <button
              onClick={() => setGameState('idle')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 text-xs font-heading font-bold shadow-soft hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>{t('practiceArena.title', 'Practice Arena')}</span>
            </button>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-heading font-semibold text-primary mb-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>{t('practiceArena.badge', 'Air Gesture Arcade')}</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight flex items-center gap-1.5">
                <span>{t('practiceArena.practice', 'Practice')}</span>
                <span className="text-primary relative inline-block">
                  {t('practiceArena.arena', 'Arena')}
                  <svg className="absolute -top-3 -right-4 w-5 h-5 text-sky-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 14 L1 11 M12 6 L12 2 M18 10 L22 7" />
                  </svg>
                </span>
              </h1>
              <p className="text-xs text-muted hidden sm:block mt-0.5">
                {t('practiceArena.desc', 'Train and improve your hand gesture control with interactive games.')}
              </p>
            </div>
          )}
        </div>

        {/* Center: 4 Attractive Game Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 text-xs font-heading font-bold shadow-soft overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('balloon');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'balloon'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <span>🎈</span>
            <span>{t('practiceArena.balloonPop', 'Balloon Pop')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fruit');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'fruit'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <span>🍉</span>
            <span>{t('practiceArena.fruitSlash', 'Fruit Slash')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('match');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'match'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <span>🎯</span>
            <span>{t('practiceArena.gestureMatch', 'Gesture Match')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('draw');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'draw'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <span>✏️</span>
            <span>{t('practiceArena.airDraw', 'Air Draw')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rps');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'rps'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <span>✊</span>
            <span>{t('practiceArena.rps', 'Rock Paper')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('count');
              setGameState('idle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-150 ${activeTab === 'count'
              ? 'bg-[#1D63E8] text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-card/40'
              }`}
          >
            <Hand className="w-4 h-4" />
            <span>{t('practiceArena.fingerCount', 'Finger Count')}</span>
          </button>
        </div>

        {/* Right: In-Game Difficulty or Global Action Controls */}
        <div className="flex items-center gap-2">
          {isPlayingMode && activeTab !== 'draw' && (
            <div className="flex items-center gap-1 bg-white/90 dark:bg-card/80 p-1 rounded-xl border border-border text-xs font-heading font-semibold shadow-soft">
              <span className="text-muted px-1.5 hidden sm:inline text-[11px]">{t('practiceArena.difficulty', 'Difficulty:')}</span>
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-2.5 py-0.5 rounded-lg capitalize text-xs transition-colors ${difficulty === diff ? 'bg-primary text-white font-bold' : 'text-muted hover:text-foreground'
                    }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowRulesOverlay(true)}
            className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-card text-foreground hover:bg-slate-50 transition-colors shadow-soft"
            title="Rules & Tips"
            aria-label="Rules & Tips"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
          </button>

          {activeTab !== 'draw' && (
            <button
              onClick={() => setArMode(!arMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-soft ${arMode
                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                : 'border-blue-100 dark:border-blue-900/40 bg-white dark:bg-card text-muted hover:text-foreground'
                }`}
              title="Toggle AR Camera Mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{arMode ? 'AR: ON' : 'AR: OFF'}</span>
            </button>
          )}

          <button
            onClick={() => setIsCalibrating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-card text-foreground text-xs font-semibold hover:bg-slate-50 transition-colors shadow-soft"
          >
            <Crosshair className="w-3.5 h-3.5 text-primary" />
            <span>{t('practiceArena.calibrate', 'Calibrate')}</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-card text-muted hover:text-foreground transition-colors shadow-soft"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-muted" /> : <Volume2 className="w-4 h-4 text-primary" />}
          </button>

          <button
            onClick={() => {
              const next = voiceService.toggleEnabled();
              setVoiceEnabled(next);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-soft ${voiceEnabled
              ? 'bg-primary/10 border-primary/30 text-primary font-bold'
              : 'border-blue-100 dark:border-blue-900/40 bg-white dark:bg-card text-muted hover:text-foreground'
              }`}
            title={voiceEnabled ? t('practiceArena.voiceActive', 'Voice: ON') : t('practiceArena.voiceMuted', 'Voice: OFF')}
            aria-label={t('practiceArena.voiceToggle', 'Voice Feedback')}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5 text-muted" />}
            <span>{voiceEnabled ? t('practiceArena.voiceActive', 'Voice: ON') : t('practiceArena.voiceMuted', 'Voice: OFF')}</span>
            {!voiceService.hasVoiceAvailable && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={t('settings.voiceFeedbackNoVoice', 'No speech synthesis voice available in this browser.')} />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GAME STATUS HUD BAR (Score, Lives, High Score, Timer)  */}
      {/* ======================================================== */}
      {!isPlayingMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100/80 dark:border-blue-900/40 shadow-soft text-xs font-heading">
          <div className="flex items-center gap-5 sm:gap-7 flex-wrap">
            {/* Score */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-muted">{t('practiceArena.score', 'Score:')}</span>
              <span className="font-mono text-primary font-black text-base">{score}</span>
            </div>

            {/* Lives (hidden in Air Draw) */}
            {activeTab !== 'draw' && (
              <div className="flex items-center gap-1.5 pl-4 sm:pl-6 border-l border-border">
                <span className="text-muted mr-1">{t('practiceArena.lives', 'Lives:')}</span>
                {[1, 2, 3].map((h) => (
                  <Heart
                    key={h}
                    className={`w-4 h-4 transition-transform ${h <= lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-300 dark:text-slate-700 fill-transparent scale-90'
                      }`}
                  />
                ))}
              </div>
            )}

            {/* Combo Multiplier */}
            {comboMultiplier > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 font-bold text-[11px] animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{comboMultiplier}x COMBO</span>
              </div>
            )}

            {/* High Score */}
            <div className="flex items-center gap-2 pl-4 sm:pl-6 border-l border-border hidden sm:flex">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className="text-muted">{t('practiceArena.highScore', 'High Score:')}</span>
              <span className="font-mono font-bold text-foreground">{bestScores[activeTab] || 0}</span>
            </div>
          </div>

          {/* 60s Timer or Air Draw Status */}
          <div className="flex items-center gap-3">
            {activeTab === 'draw' ? (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isPenDown ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`}
                />
                <span className="text-xs font-semibold text-foreground">
                  {isPenDown ? 'Pen Down' : 'Pen Up'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 text-foreground font-mono font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{`${timeLeft}s`}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN ARENA VIEW (Lobby vs Active In-Game Mode)         */}
      {/* ======================================================== */}
      {!isPlayingMode ? (
        /* -------------------------------------------------------- */
        /* A. IDLE LOBBY VIEW (Matching Reference Mockups)          */
        /* -------------------------------------------------------- */
        <div className="rounded-[32px] bg-white dark:bg-[#111C35] border border-blue-100/80 dark:border-blue-900/40 shadow-[0_20px_50px_rgba(29,99,232,0.06)] p-6 sm:p-8 space-y-6">
          {/* Top Title & Captions inside Card (Centered) */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="text-2xl">
                {activeTab === 'balloon' ? '🎈' : activeTab === 'fruit' ? '🍉' : activeTab === 'match' ? '🎯' : '✏️'}
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                {activeTab === 'balloon'
                  ? t('practiceArena.balloonPopArena', 'Balloon Pop Arena')
                  : activeTab === 'fruit'
                    ? t('practiceArena.fruitSlashChallenge', 'Fruit Slash Challenge')
                    : activeTab === 'match'
                      ? t('practiceArena.matchChallenge', '10-Round Gesture Match')
                      : t('practiceArena.airDrawStudio', 'Air Draw Studio')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              {activeTab === 'balloon'
                ? t('practiceArena.balloonLobbyDesc', 'Pop floating balloons using your fingertip or pinch gesture. Avoid bombs!')
                : activeTab === 'fruit'
                  ? t('practiceArena.fruitLobbyDesc', 'Slice fruit projectiles soaring in physics arcs across the screen with your blade.')
                  : activeTab === 'match'
                    ? t('practiceArena.matchLobbyDesc', 'Fast reaction challenge: match target gestures before the countdown timer expires.')
                    : t('practiceArena.airDrawLobbyDesc', 'Freehand spatial drawing in 3D air with stabilization and export.')}
            </p>
          </div>

          {/* Panoramic Lobby Visual Illustration (Full Width) */}
          <div className="w-full">
            <PracticeLobbyVisual game={activeTab} />
          </div>

          {/* 3 Game Instructions Cards (Point & Hover, Hover or Pinch, Avoid Bombs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeTab === 'balloon' ? (
              <>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">☝️</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardPointHover', '1. Point & Hover')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardPointHoverDesc', 'Move your fingertip over balloons across the arena.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">🤏</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardHoverPinch', '2. Hover or Pinch')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardHoverPinchDesc', 'Hold pointer on balloon for 300ms or pinch to pop instantly.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">💣</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardAvoidBombs', '3. Avoid Bombs')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardAvoidBombsDesc', 'Hitting red skull bombs will deduct a precious life heart!')}
                    </p>
                  </div>
                </div>
              </>
            ) : activeTab === 'fruit' ? (
              <>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">⚔️</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardBladeSwipe', '1. Blade Swipe')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardBladeSwipeDesc', 'Swipe your fingertip quickly across airborne fruits to slash.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">🍉</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardFlyingArcs', '2. Flying Arcs')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardFlyingArcsDesc', 'Fruits launch upward in physics arcs. Hit them before they fall!')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">💣</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardAvoidBombs', '3. Avoid Bombs')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardAvoidBombsFruitDesc', 'Do not slice bombs. In medium & hard, dropped fruits cost lives.')}
                    </p>
                  </div>
                </div>
              </>
            ) : activeTab === 'match' ? (
              <>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">🎯</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardReadTarget', '1. Read Target')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardReadTargetDesc', 'Observe the target gesture shown in the center of the arena.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">⏱️</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardQuickMatch', '2. Quick Match')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardQuickMatchDesc', 'Hold the gesture steadily before the round timer reaches 0.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">🏆</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.card10Rounds', '3. 10 Rounds')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.card10RoundsDesc', 'Build speed and unlock performance analysis for your hand.')}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">🤏</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardPinchDraw', '1. Pinch to Draw')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardPinchDrawDesc', 'Bring thumb and index fingertip together to start drawing.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">✋</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardReleaseLift', '2. Release to Lift')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardReleaseLiftDesc', 'Open palm or release pinch to lift pen without stray strokes.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-card/50 border border-slate-200/80 dark:border-blue-900/40 shadow-soft flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">✊</span>
                  <div className="space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-foreground">{t('practiceArena.cardFistErase', '3. Fist to Erase')}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {t('practiceArena.cardFistEraseDesc', 'Hold a closed fist for 600ms to quickly toggle the eraser.')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controls Bar: Difficulty + Start Camera + Play with Mouse + Start Game */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-blue-900/30">
            {/* Difficulty Picker */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-50 dark:bg-card/60 border border-slate-200 dark:border-border text-xs font-heading font-semibold">
              <span className="text-muted px-2">{t('practiceArena.difficulty', 'Difficulty:')}</span>
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${difficulty === diff ? 'bg-primary text-white font-bold' : 'text-muted hover:text-foreground'
                    }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {!isStreaming ? (
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-4 py-2.5 rounded-2xl border border-primary/40 bg-white dark:bg-card hover:bg-slate-50 text-primary font-heading font-bold text-xs shadow-soft flex items-center gap-2 transition-transform hover:-translate-y-[1px]"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('practiceArena.startCamera', 'Start Camera')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopCamera()}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-rose-500/10 border border-emerald-500/20 hover:border-rose-500/30 text-emerald-600 hover:text-rose-600 dark:text-emerald-400 font-heading font-semibold text-xs flex items-center gap-2 transition-colors"
                  title="Click to stop camera"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t('practiceArena.cameraActive', 'Camera Active (Turn Off)')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPlayWithMouse(!playWithMouse)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-heading font-semibold flex items-center gap-2 transition-all ${playWithMouse
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'bg-white dark:bg-card hover:bg-slate-50 border-slate-200 dark:border-border text-foreground'
                  }`}
              >
                <MousePointer className="w-4 h-4" />
                <span>{playWithMouse ? t('practiceArena.mouseOn', 'Mouse: ON') : t('practiceArena.playWithMouse', 'Play with mouse')}</span>
              </button>

              <button
                type="button"
                onClick={startGame}
                className="px-7 py-3 rounded-2xl bg-[#1D63E8] hover:bg-[#1554c9] text-white font-heading font-bold text-sm shadow-[0_8px_20px_rgba(29,99,232,0.35)] flex items-center gap-2 transition-all duration-150 hover:-translate-y-[1px] active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t('practiceArena.startGame', 'Start Game')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------- */
        /* B. ACTIVE IN-GAME 3-COLUMN VIEW (Matching Bottom Reference)*/
        /* -------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUMN 1 (Left 6 or 7 cols): Main Interactive Game Arena Stage */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div
              ref={arenaRef}
              onMouseMove={handleArenaMouseMove}
              className={`relative w-full aspect-[4/3] max-w-[800px] mx-auto min-h-[420px] sm:min-h-[480px] rounded-[28px] overflow-hidden bg-slate-900 border-2 border-blue-200/80 dark:border-blue-900/50 shadow-elevated select-none ${screenShake ? 'animate-bounce' : ''
                }`}
            >
              {/* Live Video Feed (Hidden unless AR mode is explicitly ON and not in Air Draw) */}
              <video
                ref={setVideoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${isStreaming && arMode && activeTab !== 'draw'
                    ? 'opacity-[0.55] filter brightness-115 contrast-105'
                    : 'opacity-0 pointer-events-none'
                  }`}
              />

              {/* Hand Skeleton Overlay in arena (only shown when AR mode is ON and not in Air Draw) */}
              {arMode && activeTab !== 'draw' && (
                <HandOverlayCanvas
                  className={`transition-opacity duration-300 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
                  videoDimensions={{
                    width: videoRef.current?.videoWidth || 640,
                    height: videoRef.current?.videoHeight || 480,
                    objectFit: 'cover',
                  }}
                />
              )}

              {/* Game Scene Backdrop (Always visible normal game scene when AR is off or in Air Draw) */}
              {(!arMode || activeTab === 'draw') && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#EBF3FF] via-[#F3F8FF] to-[#DCEBFF] dark:from-[#0B152B] dark:via-[#111E3B] dark:to-[#0A1224] pointer-events-none">
                  {/* Subtle arcade grid and radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(29,99,232,0.09),transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(29,99,232,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(29,99,232,0.035)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                </div>
              )}

              {/* Camera Off Prompt in arena */}
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-center p-4 space-y-2 select-none pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-soft max-w-sm mx-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t('practiceArena.cameraFeedOff', 'Camera feed is off. You can play using your mouse or start the camera feed.')}
                    </p>
                    <button
                      onClick={() => startCamera()}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft hover:bg-primary-hover transition-colors"
                    >
                      {t('practiceArena.startCamera', 'Start Camera')}
                    </button>
                  </div>
                </div>
              )}

              {/* LIVE Camera & Tracking Status Badge top-left */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${!isStreaming
                      ? 'bg-slate-400'
                      : freshHandDetected
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400 animate-pulse'
                      }`}
                  />
                  <span>
                    {!isStreaming
                      ? t('practiceArena.statusOff', 'Off')
                      : freshHandDetected
                        ? `${t('practiceArena.statusTracking', 'Tracking')} (${engineState.filteredGesture})`
                        : t('practiceArena.handNotFound', 'Hand not found')}
                  </span>
                  {isStreaming && (
                    <>
                      <span className="text-white/40">|</span>
                      <span>FPS: {engineState.cameraFps || 30}</span>
                    </>
                  )}
                </div>

                {/* Big Pen Status Chip in Air Draw */}
                {activeTab === 'draw' && (
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono border backdrop-blur-md flex items-center gap-1.5 shadow-soft transition-colors ${isPenDown
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-black/60 text-slate-300 border-white/20'
                      }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${isPenDown ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                    <span>{isPenDown ? t('practiceArena.penDown', 'Pen down') : t('practiceArena.penUp', 'Pen up')}</span>
                  </div>
                )}
              </div>

              {/* Floating Balloon Pop Particles & Scores */}
              <PracticePopParticles effects={popEffects} />

              {/* GAME 1: BALLOONS IN ARENA */}
              {activeTab === 'balloon' &&
                balloons.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: `${b.radius * 2}px`,
                      height: `${b.radius * 2.4}px`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-75 select-none z-20"
                  >
                    {b.type === 'bomb' ? (
                      /* 3D Hazard Skull Bomb */
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7F1D1D] via-[#991B1B] to-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.7)] border border-red-300 flex items-center justify-center">
                        <span className="text-base select-none">💀</span>
                        {/* Burning spark */}
                        <span className="absolute -top-2 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      </div>
                    ) : (
                      /* 3D Glossy Balloon Sphere */
                      <div
                        style={{
                          background: `radial-gradient(circle at 35% 35%, #FFFFFF 0%, ${b.color} 55%, #0F172A 120%)`,
                          boxShadow: `0 10px 25px ${b.color}66`,
                        }}
                        className="w-full h-full rounded-full relative flex items-center justify-center"
                      >
                        {/* Specular reflection gloss */}
                        <span className="absolute top-1 left-2 w-2 h-4 rounded-full bg-white/60 blur-[0.5px]" />
                        {b.type === 'gold' && <span className="text-base select-none">⭐</span>}
                        {b.type === 'clock' && <span className="text-base select-none">⏰</span>}
                        {/* Tie Knot */}
                        <div
                          style={{ borderTopColor: b.color }}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent w-0 h-0"
                        />
                      </div>
                    )}
                  </div>
                ))}

              {/* GAME 2: FRUIT SLASH IN ARENA */}
              {activeTab === 'fruit' && (
                <>
                  {fruits.map((f) =>
                    f.slashed && f.halves ? (
                      <React.Fragment key={f.id}>
                        <div
                          style={{
                            left: `${f.halves.leftX}%`,
                            top: `${f.halves.leftY}%`,
                            transform: `rotate(${f.rotation - 25}deg)`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none opacity-85 select-none z-20"
                        >
                          {f.emoji}
                        </div>
                        <div
                          style={{
                            left: `${f.halves.rightX}%`,
                            top: `${f.halves.rightY}%`,
                            transform: `rotate(${f.rotation + 25}deg)`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none opacity-85 select-none z-20"
                        >
                          {f.emoji}
                        </div>
                      </React.Fragment>
                    ) : (
                      <div
                        key={f.id}
                        style={{
                          left: `${f.x}%`,
                          top: `${f.y}%`,
                          transform: `rotate(${f.rotation}deg)`,
                          filter: `drop-shadow(0 0 14px ${f.color}88)`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl select-none cursor-pointer transition-transform z-20"
                      >
                        {f.emoji}
                      </div>
                    )
                  )}

                  {/* Juice splash particles */}
                  {juiceParticles.map((jp) => (
                    <div
                      key={jp.id}
                      style={{
                        left: `${jp.x}%`,
                        top: `${jp.y}%`,
                        width: `${jp.size}px`,
                        height: `${jp.size}px`,
                        backgroundColor: jp.color,
                        opacity: jp.alpha,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none shadow-sm z-20"
                    />
                  ))}

                  {/* Glowing Blade Trail */}
                  {bladeTrail.length > 2 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                      <polyline
                        points={bladeTrail.map((p) => `${(p.x / 100) * (arenaRef.current?.clientWidth || 1000)},${(p.y / 100) * (arenaRef.current?.clientHeight || 600)}`).join(' ')}
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 0 8px #00E5FF)' }}
                        opacity="0.85"
                      />
                    </svg>
                  )}
                </>
              )}

              {/* GAME 3: GESTURE MATCH IN ARENA */}
              {activeTab === 'match' && gameState === 'playing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center z-20">
                  <div className="text-xs uppercase font-bold text-white font-mono tracking-widest drop-shadow-md">
                    Round {matchRound} of 10
                  </div>
                  <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#111C35]/95 border border-blue-200 dark:border-blue-900 shadow-elevated flex flex-col items-center gap-3 backdrop-blur-md">
                    <span className="text-7xl animate-bounce">{currentTargetGesture.emoji}</span>
                    <h3 className="font-heading font-black text-2xl text-foreground">
                      Show &quot;{currentTargetGesture.label}&quot;!
                    </h3>
                    <div className="w-48 h-2.5 bg-slate-200 dark:bg-card rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (matchRoundTimeLeft / 4.0) * 100)}%` }}
                        className="h-full bg-primary transition-all duration-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GAME 4: AIR DRAW IN ARENA */}
              {activeTab === 'draw' && (
                <>
                  {/* First-use hint over canvas */}
                  {!hasDrawnFirstStroke && strokes.length === 0 && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#111C35]/95 border border-blue-200 dark:border-blue-800 shadow-elevated flex items-center gap-3 backdrop-blur-md animate-fade-in pointer-events-none select-none">
                      <span className="text-2xl animate-bounce">☝️</span>
                      <p className="text-xs font-semibold text-foreground">
                        {t('practiceArena.firstUseHint', 'Point with your index finger to draw. Open your palm to stop.')}
                      </p>
                    </div>
                  )}

                  <canvas
                    ref={drawCanvasRef}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                    className="absolute inset-0 w-full h-full object-cover z-20 cursor-crosshair touch-none"
                  />
                  {/* Air Draw Toolbar */}
                  <div className="absolute top-3 right-3 z-30 p-2 rounded-2xl bg-white/95 dark:bg-[#111C35]/95 border border-border shadow-card flex items-center gap-2 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-border">
                      {AIR_DRAW_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setBrushColor(c);
                            setIsEraser(false);
                          }}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${brushColor === c && !isEraser ? 'scale-125 border-primary ring-2 ring-primary/40' : 'border-border/60'
                            }`}
                          title={c}
                        />
                      ))}
                    </div>
                    {/* Eraser */}
                    <button
                      onClick={() => setIsEraser(!isEraser)}
                      className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-colors ${isEraser ? 'bg-primary text-white border-primary shadow-xs' : 'bg-surface-secondary border-border text-muted hover:text-foreground'
                        }`}
                      title="Eraser (or hold Closed Fist 600ms)"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-semibold">{t('practiceArena.eraser', 'Eraser')}</span>
                    </button>

                    {/* Brush Size Slider */}
                    <div className="flex items-center gap-1 px-1">
                      <input
                        type="range"
                        min={2}
                        max={24}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-14 h-1.5 accent-primary cursor-pointer"
                        title={`Brush size: ${brushSize}px`}
                      />
                    </div>

                    {/* Stabilizer Level */}
                    <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-xl border border-border text-[10px]">
                      {(['off', 'low', 'medium', 'high'] as StabilizerLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setStabilizer(lvl)}
                          className={`px-1.5 py-0.5 rounded capitalize transition-colors ${stabilizer === lvl ? 'bg-primary text-white font-bold' : 'text-muted hover:text-foreground'
                            }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    {/* Test Canvas Button */}
                    <button
                      type="button"
                      onClick={handleDrawTestStroke}
                      className="px-2 py-1 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-[10px] text-foreground font-semibold flex items-center gap-1 transition-colors"
                      title={t('practiceArena.testCanvas', 'Test canvas')}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{t('practiceArena.testCanvas', 'Test canvas')}</span>
                    </button>

                    {/* Pen Trigger Mode */}
                    <button
                      type="button"
                      onClick={() => setPenMode((m) => (m === 'pinch' ? 'pointing' : 'pinch'))}
                      className="px-2 py-1 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-[10px] text-foreground font-semibold transition-colors"
                      title={t('practiceArena.penMode', 'Pen Mode')}
                    >
                      {penMode === 'pinch' ? `🤏 ${t('practiceArena.pinchToDraw', 'Pinch to draw')}` : `☝️ ${t('practiceArena.pointToDraw', 'Point to draw')}`}
                    </button>
                    <button
                      onClick={handleUndo}
                      disabled={strokes.length === 0}
                      className="p-1.5 rounded-lg border border-border bg-surface-secondary text-foreground hover:bg-surface disabled:opacity-30 text-xs"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-1.5 rounded-lg border border-border bg-surface-secondary text-foreground hover:bg-surface disabled:opacity-30 text-xs"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClearConfirmOpen(true)}
                      disabled={strokes.length === 0}
                      className="p-1.5 rounded-lg border border-border bg-surface-secondary text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 text-xs"
                      title="Clear All Strokes"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSavePng}
                      disabled={strokes.length === 0}
                      className="p-1.5 rounded-lg border border-border bg-primary text-white hover:bg-primary-hover disabled:opacity-30 text-xs"
                      title="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {/* GAME 5: ROCK PAPER SCISSORS IN ARENA */}
              {activeTab === 'rps' && gameState === 'playing' && (
                <RpsGame
                  currentGesture={engineState.filteredGesture}
                  onScoreUpdate={(s) => setScore((prev) => prev + s)}
                  playSfx={(type) => (type === 'cheer' ? sfx.playMatchSuccess() : sfx.playPop())}
                />
              )}

              {/* GAME 6: FINGER COUNT IN ARENA */}
              {activeTab === 'count' && gameState === 'playing' && (
                <FingerCountGame
                  landmarks={getLandmarks()}
                  onScoreUpdate={(s) => setScore((prev) => prev + s)}
                  playSfx={(type) => (type === 'cheer' ? sfx.playMatchSuccess() : sfx.playPop())}
                />
              )}

              {/* Fingertip Pointer Ring Indicator */}
              {pointer.isVisible && (
                <div
                  style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-transform duration-75"
                >
                  <div
                    className={`w-9 h-9 rounded-full border-2 border-primary shadow-elevated flex items-center justify-center transition-all ${
                      (activeTab === 'draw' ? isPenDown : pointer.isPinching)
                        ? 'scale-90 bg-primary ring-4 ring-primary/30'
                        : 'scale-100 bg-primary/20'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'draw' && isPenDown ? 'bg-white' : 'bg-primary'}`} />
                  </div>
                </div>
              )}

              {/* Input Debug HUD (visible in every game, toggled with Shift+D) */}
              {debugHudOpen && (
                <div className="absolute bottom-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white font-mono text-[11px] backdrop-blur-md border border-slate-700/60 shadow-lg flex items-center gap-2 select-none pointer-events-none">
                  <span className={`w-2 h-2 rounded-full ${hudData.hasHand ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span>
                    Hand: {hudData.hasHand ? 'yes' : 'no'} | Pointer: {hudData.pointerX}, {hudData.pointerY} | Pinch: {hudData.pinchRatio.toFixed(2)} / {hudData.pinchThreshold.toFixed(2)} | Pen: {hudData.isPenDown ? 'down' : 'up'} | Gesture: {hudData.gesture}
                  </span>
                  <span className="text-white/40 text-[9px] border-l border-white/20 pl-1.5">Shift+D</span>
                </div>
              )}

              {/* 3-2-1 Countdown Overlay */}
              {gameState === 'countdown' && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-xs z-40 flex flex-col items-center justify-center">
                  <span className="font-heading font-black text-6xl text-primary animate-ping">{countdown}</span>
                  <p className="text-xs font-heading font-semibold text-muted mt-4">{t('practiceArena.getReady', 'Get ready!')}</p>
                </div>
              )}

              {/* Paused Overlay */}
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs z-40 flex flex-col items-center justify-center p-6 text-center gap-4">
                  <Pause className="w-10 h-10 text-primary" />
                  <h2 className="font-heading font-black text-2xl text-foreground">{t('practiceArena.gamePaused', 'Game Paused')}</h2>
                  <p className="text-xs text-muted max-w-xs">{t('practiceArena.holdOpenPalmResume', 'Hold Open Palm for 1s or click below to resume.')}</p>
                  <button
                    onClick={() => setGameState('playing')}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-heading font-semibold text-xs shadow-card"
                  >
                    {t('practiceArena.resumeGame', 'Resume Game')}
                  </button>
                </div>
              )}

              {/* Game Over Modal */}
              <PracticeGameOverModal
                isOpen={gameState === 'gameover'}
                lives={lives}
                activeTab={activeTab}
                hardestGesture={activeTab === 'match' ? getHardestGesture() : undefined}
                score={score}
                successfulHits={successfulHits}
                bestScore={bestScores[activeTab] || score}
                onPlayAgain={startGame}
                onExit={() => setGameState('idle')}
              />
            </div>
          </div>

          {/* COLUMN 2 (Center 3 cols): Stat Cards & Shortcuts */}
          <div className="lg:col-span-3 xl:col-span-2 space-y-4">
            {/* 3 Stat Cards in a row/grid (Matching Bottom Reference Mockup) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100 dark:border-blue-900/40 shadow-soft text-center space-y-1">
                <Trophy className="w-4 h-4 text-amber-500 mx-auto" />
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">{t('practiceArena.scoreShort', 'Score')}</span>
                <span className="font-mono text-foreground font-black text-lg sm:text-xl block">{score}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100 dark:border-blue-900/40 shadow-soft text-center space-y-1">
                <Heart className="w-4 h-4 text-rose-500 mx-auto fill-rose-500" />
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">{t('practiceArena.livesShort', 'Lives')}</span>
                <div className="flex items-center justify-center gap-0.5 text-xs py-0.5">
                  {lives > 0 ? (
                    [1, 2, 3].map((h) => (
                      <span key={h} className={h <= lives ? 'opacity-100' : 'opacity-20'}>❤️</span>
                    ))
                  ) : (
                    <span>💀</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100 dark:border-blue-900/40 shadow-soft text-center space-y-1">
                <Clock className="w-4 h-4 text-primary mx-auto" />
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">{t('practiceArena.timeShort', 'Time')}</span>
                <span className="font-mono text-foreground font-black text-lg sm:text-xl block">{`${timeLeft}s`}</span>
              </div>
            </div>

            {/* Separate Small Camera View Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100 dark:border-blue-900/40 shadow-soft space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-foreground">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>{t('practiceArena.cameraView', 'Camera View')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = !isStreaming
                      ? { label: t('practiceArena.statusOff', 'Off'), dot: 'bg-slate-400', badge: 'bg-slate-100 dark:bg-slate-800 text-muted border-border' }
                      : engineState.isModelLoading || !stream
                        ? { label: t('practiceArena.statusStarting', 'Starting'), dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
                        : freshHandDetected
                          ? { label: t('practiceArena.statusTracking', 'Tracking'), dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
                          : { label: t('practiceArena.handNotFound', 'Hand not found'), dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span>{status.label}</span>
                      </span>
                    );
                  })()}
                  {isStreaming && (
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {engineState.fps} FPS
                    </span>
                  )}
                </div>
              </div>

              {/* Mirrored Video Preview & Skeleton Overlay */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-border flex items-center justify-center">
                {isStreaming ? (
                  <>
                    <video
                      ref={setSideCameraVideoRef}
                      playsInline
                      muted
                      autoPlay
                      onLoadedMetadata={() => {
                        if (sideCameraVideoRef.current) {
                          sideCameraVideoRef.current.play().catch(() => { });
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                    />
                    <HandOverlayCanvas />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-muted gap-1 select-none">
                    <CameraOff className="w-5 h-5 opacity-40 text-muted" />
                    <span className="text-[11px]">{t('practiceArena.cameraInactive', 'Camera is inactive')}</span>
                  </div>
                )}
              </div>

              {/* Start / Stop Button */}
              <div>
                {!isStreaming ? (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="w-full py-1.5 px-3 rounded-xl bg-primary text-white text-xs font-heading font-semibold hover:bg-primary-hover shadow-soft flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('practiceArena.startCameraBtn', 'Start Camera')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => stopCamera()}
                    className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-heading font-semibold shadow-soft flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>{t('practiceArena.stopCameraBtn', 'Stop Camera')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Game Controls / Shortcuts Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111C35] border border-blue-100 dark:border-blue-900/40 shadow-soft space-y-2.5">
              <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-foreground">
                <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                <span>{t('practiceArena.gameControls', 'Game Controls')}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-muted font-mono">
                <li className="flex items-center justify-between">
                  <span>{t('practiceArena.ctrlStartPause', 'Start / Pause:')}</span>
                  <strong className="text-foreground">Space</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t('practiceArena.ctrlRestart', 'Restart:')}</span>
                  <strong className="text-foreground">R</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t('practiceArena.difficulty', 'Difficulty:')}</span>
                  <strong className="text-foreground">1 / 2 / 3</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t('practiceArena.ctrlExit', 'Exit:')}</span>
                  <strong className="text-foreground">Esc</strong>
                </li>
              </ul>
            </div>

            {/* In-Game Action Buttons: Pause/Resume + Restart */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                className="flex-1 h-11 rounded-2xl bg-[#1D63E8] hover:bg-[#1554c9] text-white font-heading font-bold text-xs shadow-soft flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {gameState === 'playing' ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>{t('practiceArena.pauseGame', 'Pause Game')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{t('practiceArena.resumeGame', 'Resume Game')}</span>
                  </>
                )}
              </button>

              <button
                onClick={startGame}
                className="w-11 h-11 rounded-2xl border border-slate-200 dark:border-blue-900 bg-white dark:bg-card text-foreground hover:bg-slate-50 flex items-center justify-center shadow-soft transition-transform active:scale-95"
                title="Restart Round (R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* COLUMN 3 (Right 3 cols): Recent Arcade Sessions Table */}
          <PracticeHistoryTable
            history={history}
            rulesCardOpen={rulesCardOpen}
            setRulesCardOpen={setRulesCardOpen}
          />
        </div>
      )}

      {/* 4. RECENT ARCADE SESSIONS TABLE (In Idle Mode)           */}
      {/* ======================================================== */}
      {!isPlayingMode && (
        <div className="rounded-3xl bg-white dark:bg-[#111C35] border border-blue-100/80 dark:border-blue-900/40 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/30 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-bold text-sm text-foreground">{t('practiceArena.recentSessions', 'Recent Arcade Sessions')}</h3>
            </div>
            <span className="text-xs text-muted">{t('practiceArena.persistedIndexedDb', 'Persisted in IndexedDB')}</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted">{t('practiceArena.noGamesLoggedAbove', 'No games logged yet. Play a round above!')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted font-heading font-semibold">
                    <th className="pb-2">{t('practiceArena.colTime', 'Time')}</th>
                    <th className="pb-2">{t('practiceArena.colGame', 'Game')}</th>
                    <th className="pb-2">{t('practiceArena.colScore', 'Score')}</th>
                    <th className="pb-2">{t('practiceArena.colAccuracy', 'Accuracy')}</th>
                    <th className="pb-2 text-right">{t('practiceArena.colResult', 'Result')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-blue-950/40">
                  {history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-card/40">
                      <td className="py-2.5 text-foreground">
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 capitalize text-primary font-bold">{rec.game}</td>
                      <td className="py-2.5 text-foreground font-black">{rec.score}</td>
                      <td className="py-2.5 text-muted">{rec.accuracy}%</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${rec.result === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {rec.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. HOW TO PLAY OVERLAY MODAL                             */}
      {/* ======================================================== */}
      <PracticeRulesModal
        isOpen={showRulesOverlay}
        onClose={() => setShowRulesOverlay(false)}
      />

      <PracticeCalibrationModal
        isOpen={isCalibrating}
        step={calibrateStep}
        onRecordPoint={recordCalibrationPoint}
        onClose={() => setIsCalibrating(false)}
      />

      {/* Clear canvas confirmation dialog for Air Draw */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-card border border-border shadow-elevated max-w-sm text-center space-y-3">
            <h3 className="font-heading font-bold text-base text-foreground">{t('practiceArena.clearCanvasTitle', 'Clear canvas?')}</h3>
            <p className="text-xs text-muted">{t('practiceArena.clearCanvasDesc', 'All current strokes will be permanently removed.')}</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs text-foreground font-semibold"
              >
                {t('practiceArena.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleClearStrokes}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-soft"
              >
                {t('practiceArena.clearAll', 'Clear All')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;
