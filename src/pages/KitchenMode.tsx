import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Utensils,
  Timer,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Volume2,
  CheckSquare,
  Square,
  Camera,
  CameraOff,
  Bell,
  ChefHat,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '../context/CameraContext';
import { useGestureEngine } from '../engine';
import { RECIPES, resolveStepText, type Step } from './kitchen/recipesData';
import { alarm } from './kitchen/KitchenAlarm';
import { KitchenPracticeModal } from './kitchen/KitchenPracticeModal';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { db, logGestureEvent } from '../db/db';

type TimerStatus = 'running' | 'paused' | 'done';

interface ActiveTimer {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  endTimestamp?: number;
}

export const KitchenMode: React.FC = () => {
  const { t } = useTranslation();
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceStep, setPracticeStep] = useState(0);

  // Cooking state & elapsed timer
  const [isCooking, setIsCooking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [cookingStartTime, setCookingStartTime] = useState<number>(Date.now());
  const [totalCookingTimeSeconds, setTotalCookingTimeSeconds] = useState(0);

  // Collapsible How It Works (persisted in localStorage)
  const [howItWorksOpen, setHowItWorksOpen] = useState(() => {
    try {
      return localStorage.getItem('aerotouch_kitchen_how_it_works') !== 'closed';
    } catch {
      return true;
    }
  });

  const toggleHowItWorks = () => {
    setHowItWorksOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aerotouch_kitchen_how_it_works', next ? 'open' : 'closed');
      } catch { }
      return next;
    });
  };

  // Persistent Timers
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_kitchen_timers');
      if (saved) {
        const parsed: ActiveTimer[] = JSON.parse(saved);
        const now = Date.now();
        return parsed.map((item) => {
          if (item.status === 'running' && item.endTimestamp) {
            const rem = Math.max(0, Math.round((item.endTimestamp - now) / 1000));
            return {
              ...item,
              remainingSeconds: rem,
              status: rem > 0 ? 'running' : 'done',
            };
          }
          return item;
        });
      }
    } catch { }
    return [];
  });

  const { isStreaming, isLoading, startCamera, stopCamera } = useCamera();
  const wakeLockRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const recipe = RECIPES[selectedRecipeIndex] || RECIPES[0];
  const currentStep = recipe.steps[currentStepIndex] || recipe.steps[0];

  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2400);
  }, []);

  // Save active timers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aerotouch_kitchen_timers', JSON.stringify(activeTimers));
    } catch { }
  }, [activeTimers]);

  // Request Wake Lock
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch { }
    }
  };

  const startCookingMode = async () => {
    if (!isStreaming) {
      await startCamera();
    }
    await requestWakeLock();
    setIsCooking(true);
    setIsDone(false);
    setCurrentStepIndex(0);
    setCookingStartTime(Date.now());
  };

  const handleStartHandsFree = async () => {
    await startCamera();
    await requestWakeLock();
    setPracticeModalOpen(true);
    setPracticeStep(0);
  };

  // Speak step aloud via SpeechSynthesis
  const speakCurrentStep = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const resolvedDesc = resolveStepText(currentStep.desc, recipe.ingredients, servingMultiplier);
      const utterance = new SpeechSynthesisUtterance(
        `Step ${currentStep.num}: ${currentStep.title}. ${resolvedDesc}`
      );
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast(t('kitchenMode.readingStep'));
    }
  }, [currentStep, recipe.ingredients, servingMultiplier, showToast, t]);

  // Stop alarm & mark done timers as dismissed
  const stopAlarmAndTimers = useCallback(() => {
    alarm.stop();
    setIsAlarmRinging(false);
    setActiveTimers((prev) => prev.filter((tItem) => tItem.status !== 'done'));
    showToast(t('kitchenMode.toastDismissed'));
  }, [showToast, t]);

  // Add step timer to active timers list
  const startStepTimer = useCallback((step: Step) => {
    if (!step.timerSeconds) return;

    // Check if a timer for this step is already running
    const existing = activeTimers.find(
      (tItem) => tItem.name === (step.timerName || `Step ${step.num} Timer`)
    );
    if (existing) {
      if (existing.status === 'paused') {
        const endTimestamp = Date.now() + existing.remainingSeconds * 1000;
        setActiveTimers((prev) =>
          prev.map((tItem) =>
            tItem.id === existing.id ? { ...tItem, status: 'running', endTimestamp } : tItem
          )
        );
        showToast(`${t('kitchenMode.toastTimerStarted')}: ${existing.name}`);
        return;
      } else if (existing.status === 'running') {
        return;
      }
    }

    const endTimestamp = Date.now() + step.timerSeconds * 1000;
    const newTimer: ActiveTimer = {
      id: Math.random().toString(36).substring(2, 9),
      name: step.timerName || `Step ${step.num} Timer`,
      totalSeconds: step.timerSeconds,
      endTimestamp,
      remainingSeconds: step.timerSeconds,
      status: 'running',
    };
    setActiveTimers((prev) => [...prev, newTimer]);
    showToast(`${t('kitchenMode.toastTimerStarted')}: ${newTimer.name}`);
  }, [activeTimers, showToast, t]);

  // Complete recipe and persist to IndexedDB
  const handleFinishRecipe = useCallback(async () => {
    const elapsed = Math.max(1, Math.round((Date.now() - cookingStartTime) / 1000));
    setTotalCookingTimeSeconds(elapsed);
    setIsDone(true);

    try {
      await db.settings.put({
        key: `kitchen_completed_${recipe.id}_${Date.now()}`,
        value: {
          recipeId: recipe.id,
          recipeName: recipe.name,
          totalSeconds: elapsed,
          servings: recipe.servingsBase * servingMultiplier,
          completedAt: Date.now(),
        },
        synced: false,
        updatedAt: Date.now(),
      });
      await logGestureEvent('Thumb_Up', 'COMPLETE_RECIPE', 0.99, 'kitchen');
    } catch (err) {
      console.warn('Failed to save completion to IndexedDB:', err);
    }
  }, [cookingStartTime, recipe.id, recipe.name, recipe.servingsBase, servingMultiplier]);

  // Shared Gesture Engine Hook
  const { state: engineState } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: true,
    onAction: (action, gesture) => {
      if (action === 'NEXT' || gesture === 'Swipe_Right') {
        if (!isDone) {
          if (currentStepIndex >= recipe.steps.length - 1) {
            handleFinishRecipe();
          } else {
            setCurrentStepIndex((prev) => prev + 1);
            showToast(t('kitchenMode.toastNext'));
          }
        }
      } else if (action === 'PREV' || gesture === 'Swipe_Left') {
        if (isDone) {
          setIsDone(false);
          setCurrentStepIndex(recipe.steps.length - 1);
        } else {
          setCurrentStepIndex((prev) => Math.max(0, prev - 1));
          showToast(t('kitchenMode.toastPrev'));
        }
      } else if (action === 'PLAY' || gesture === 'Closed_Fist') {
        if (!isDone && currentStep.timerSeconds) {
          startStepTimer(currentStep);
        }
      } else if (action === 'PAUSE' || gesture === 'Open_Palm') {
        stopAlarmAndTimers();
      } else if (action === 'SCREENSHOT' || gesture === 'Victory') {
        speakCurrentStep();
      }
    },
  });

  // Hold Open_Palm for 1s to dismiss alarm
  const openPalmAlarmRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isAlarmRinging) return;
    const now = Date.now();
    if (engineState.filteredGesture === 'Open_Palm') {
      if (!openPalmAlarmRef.current) {
        openPalmAlarmRef.current = now;
      } else if (now - openPalmAlarmRef.current >= 1000) {
        stopAlarmAndTimers();
        openPalmAlarmRef.current = null;
      }
    } else {
      openPalmAlarmRef.current = null;
    }
  }, [isAlarmRinging, engineState.filteredGesture, stopAlarmAndTimers]);

  // Timers countdown interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTimers((prev) =>
        prev.map((item) => {
          if (item.status !== 'running' || !item.endTimestamp) return item;
          const rem = Math.max(0, Math.round((item.endTimestamp - now) / 1000));
          if (rem <= 0 && item.remainingSeconds > 0) {
            alarm.start();
            setIsAlarmRinging(true);
            showToast(`${t('kitchenMode.toastTimerFinished')}: ${item.name}!`);
            return { ...item, remainingSeconds: 0, status: 'done' };
          }
          return { ...item, remainingSeconds: rem };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [showToast, t]);

  const toggleIngredientCheck = (name: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const cameraStatusLabel = !isStreaming
    ? t('kitchenMode.statusOff')
    : isLoading
      ? t('kitchenMode.statusStarting')
      : engineState.isLowLight
        ? t('kitchenMode.statusLowLight')
        : engineState.hasHand
          ? t('kitchenMode.statusTracking')
          : t('kitchenMode.statusNoHand');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const formatDurationLong = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Find step timer status if any
  const currentStepTimer = activeTimers.find(
    (tItem) => tItem.name === (currentStep.timerName || `Step ${currentStep.num} Timer`)
  );

  // Ingredients used in this step
  const usedIngredients = (currentStep.ingredientsUsed || [])
    .map((ingId) => recipe.ingredients.find((i) => i.id === ingId))
    .filter(Boolean);

  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;

  return (
    <div className="pt-20 sm:pt-24 max-w-6xl mx-auto px-4 pb-12 flex flex-col gap-6 relative select-none">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 text-white border border-white/10 shadow-elevated text-xs font-mono backdrop-blur-md">
          {toastNotice}
        </div>
      )}

      {/* Alarm Ringing Banner with visual flashing */}
      {isAlarmRinging && (
        <div className="p-4 rounded-2xl bg-error text-white shadow-elevated flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 animate-bounce" />
            <span className="font-heading font-black text-sm sm:text-base">
              {t('kitchenMode.alarmBanner')}
            </span>
          </div>
          <button
            onClick={stopAlarmAndTimers}
            className="px-4 py-2 rounded-xl bg-white text-error font-heading font-bold text-xs shadow-soft hover:bg-slate-100 transition-colors"
          >
            {t('kitchenMode.dismissAlarm')}
          </button>
        </div>
      )}

      {/* 1. COLLAPSIBLE "HOW IT WORKS" CARD (Remembered in localStorage) */}
      <div className="rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
        <button
          onClick={toggleHowItWorks}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-foreground">
                {t('kitchenMode.howItWorksTitle')}
              </h2>
              <p className="text-xs text-muted">
                {t('kitchenMode.desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span>{howItWorksOpen ? t('kitchenMode.howItWorksHide') : t('kitchenMode.howItWorksShow')}</span>
            {howItWorksOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {howItWorksOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                <span>1</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-heading font-bold text-foreground">
                  {t('kitchenMode.step1Title')}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  {t('kitchenMode.step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                <span>2</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-heading font-bold text-foreground">
                  {t('kitchenMode.step2Title')}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  {t('kitchenMode.step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                <span>3</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-heading font-bold text-foreground">
                  {t('kitchenMode.step3Title')}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  {t('kitchenMode.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Banner: Status & Practice Trigger */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-heading font-bold text-base sm:text-lg text-foreground">
              <span>{t('kitchenMode.title')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                {recipe.emoji}
              </span>
            </div>
            <p className="text-xs text-muted">
              {t('kitchenMode.desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => {
              setPracticeModalOpen(true);
              setPracticeStep(0);
            }}
            className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-foreground text-xs font-bold transition-colors"
          >
            {t('kitchenMode.practiceGestures')}
          </button>

          {!isStreaming ? (
            <button
              onClick={handleStartHandsFree}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-card flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{t('kitchenMode.turnOnCamera')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-heading">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('kitchenMode.handsFreeActive')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Picker Tabs (6 total) & Servings Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* 6 Recipes Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-secondary border border-border overflow-x-auto text-xs font-heading font-bold w-full sm:w-auto">
          {RECIPES.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRecipeIndex(idx);
                setCurrentStepIndex(0);
                setCheckedIngredients({});
                setIsDone(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${idx === selectedRecipeIndex
                ? 'bg-surface text-primary shadow-soft'
                : 'text-muted hover:text-foreground'
                }`}
            >
              <span>{r.emoji}</span>
              <span>{r.name}</span>
            </button>
          ))}
        </div>

        {/* Servings Multiplier (1x, 2x, 4x) */}
        <div className="flex items-center gap-2 text-xs font-heading self-end sm:self-auto">
          <span className="text-muted">{t('kitchenMode.servings')}:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-secondary border border-border">
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setServingMultiplier(mult)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${servingMultiplier === mult
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-foreground'
                  }`}
              >
                <span>{mult * recipe.servingsBase}</span>
                <span>{` (${mult}x)`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Recipe Overview OR Active Step Card OR Done Screen + Timers */}
        <div className="lg:col-span-7 space-y-6">
          {/* DONE SCREEN */}
          {isDone && (
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-soft">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                  {t('kitchenMode.recipeCompleteTitle')}
                </h2>
                <p className="text-sm text-muted">
                  {t('kitchenMode.recipeCompleteDesc')}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-surface-secondary border border-border text-xs font-bold text-foreground">
                    {recipe.name}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary font-mono">
                    {`${t('kitchenMode.totalCookingTime')}: ${formatDurationLong(totalCookingTimeSeconds)}`}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsDone(false);
                    setCurrentStepIndex(0);
                    setCookingStartTime(Date.now());
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-card flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('kitchenMode.cookAgain')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsDone(false);
                    setIsCooking(false);
                    setCurrentStepIndex(0);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-surface-secondary hover:bg-surface border border-border text-foreground font-heading font-bold text-xs transition-colors"
                >
                  {t('kitchenMode.chooseAnother')}
                </button>
              </div>
            </div>
          )}

          {/* RECIPE OVERVIEW */}
          {!isDone && !isCooking && (
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-4xl">{recipe.emoji}</span>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                    {recipe.name}
                  </h2>
                  <p className="text-sm text-muted font-heading">
                    {recipe.hindiName}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{`${t('kitchenMode.prepTime')}: ${recipe.prepTime}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-primary" />
                    <span>{`${t('kitchenMode.cookTime')}: ${recipe.cookTime}`}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between text-xs">
                <span className="text-muted font-heading">{`${recipe.steps.length} ${t('kitchenMode.steps')} · ${recipe.ingredients.length} ${t('kitchenMode.ingredients')}`}</span>
                <span className="font-bold text-primary">{`${recipe.servingsBase * servingMultiplier} ${t('kitchenMode.servings')}`}</span>
              </div>

              <button
                onClick={startCookingMode}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-base shadow-card flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{t('kitchenMode.startCooking')}</span>
              </button>
            </div>
          )}

          {/* ACTIVE STEP CARD */}
          {!isDone && isCooking && (
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card space-y-5">
              {/* Step Progress & Read Aloud Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs uppercase font-bold tracking-widest text-primary font-mono">
                  {`${t('kitchenMode.step')} ${currentStep.num} ${t('kitchenMode.of')} ${recipe.steps.length}`}
                </span>

                <button
                  onClick={speakCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-foreground hover:bg-surface text-xs font-semibold transition-colors"
                  title="Read aloud (Victory gesture ✌️)"
                >
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('kitchenMode.readAloud')}</span>
                </button>
              </div>

              {/* Step Progress Dots */}
              <div className="flex items-center gap-1.5 py-1 overflow-x-auto">
                {recipe.steps.map((st, sIdx) => {
                  const isActive = sIdx === currentStepIndex;
                  const isPast = sIdx < currentStepIndex;
                  return (
                    <button
                      key={st.num}
                      onClick={() => setCurrentStepIndex(sIdx)}
                      aria-label={`Jump to step ${st.num}`}
                      className={`h-2 rounded-full transition-all ${isActive
                        ? 'w-8 bg-primary shadow-xs'
                        : isPast
                          ? 'w-2.5 bg-primary/60'
                          : 'w-2 bg-surface-secondary border border-border hover:bg-muted'
                        }`}
                    />
                  );
                })}
              </div>

              {/* 44PX FEEDBACK STRIP */}
              <div className="h-[44px] px-4 rounded-2xl bg-surface-secondary border border-border flex items-center justify-between text-xs font-heading">
                {engineState.hasHand && engineState.filteredGesture !== 'None' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-bold text-foreground">
                      {engineState.filteredGesture.replace('_', ' ')}
                    </span>
                    {engineState.stabilityProgress > 0 && (
                      <span className="text-[10px] text-primary font-mono font-bold">
                        {`${(engineState.stabilityProgress * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted">
                    <Sparkles className="w-3.5 h-3.5 text-primary opacity-60" />
                    <span className="text-xs">{t('kitchenMode.awaiting')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {engineState.inCooldown ? (
                    <span className="text-amber-500 font-semibold">{t('kitchenMode.cooldown')}</span>
                  ) : (
                    <span className="text-emerald-500 font-semibold">{t('kitchenMode.ready')}</span>
                  )}
                </div>
              </div>

              {/* "You need for this step:" Ingredient Chips */}
              <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border space-y-2">
                <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider block">
                  {t('kitchenMode.youNeedForStep')}
                </span>
                {usedIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {usedIngredients.map((ing) => {
                      if (!ing) return null;
                      const scaled = Math.round(ing.amount * servingMultiplier * 10) / 10;
                      return (
                        <div
                          key={ing.id}
                          className="px-2.5 py-1 rounded-xl bg-surface border border-border text-foreground text-xs font-heading font-medium flex items-center gap-1.5 shadow-xs"
                        >
                          <span className="font-mono font-bold text-primary">
                            {`${scaled} ${ing.unit}`}
                          </span>
                          <span>{ing.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-muted font-heading italic">
                    {t('kitchenMode.noIngredientsForStep')}
                  </span>
                )}
              </div>

              {/* 28px Step Text */}
              <div className="space-y-3 py-2">
                <h2 className="font-heading font-black text-xl sm:text-2xl text-foreground">
                  {currentStep.title}
                </h2>
                <p className="text-foreground text-[22px] sm:text-[28px] font-body leading-relaxed font-medium">
                  {resolveStepText(currentStep.desc, recipe.ingredients, servingMultiplier)}
                </p>
              </div>

              {/* Embedded Step Timer Option */}
              {currentStep.timerSeconds ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground font-heading">
                        {currentStep.timerName || t('kitchenMode.activeTimers')}
                      </div>
                      <div className="text-[11px] text-muted">
                        <span>{formatSeconds(currentStep.timerSeconds)}</span>
                        <span>{` · `}</span>
                        <span>{t('kitchenMode.orMakeFist')}</span>
                      </div>
                    </div>
                  </div>

                  {currentStepTimer ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                        {formatSeconds(currentStepTimer.remainingSeconds)}
                      </span>
                      <button
                        onClick={() =>
                          setActiveTimers((prev) =>
                            prev.map((tItem) =>
                              tItem.id === currentStepTimer.id
                                ? {
                                  ...tItem,
                                  status: tItem.status === 'running' ? 'paused' : 'running',
                                  endTimestamp:
                                    tItem.status === 'paused'
                                      ? Date.now() + tItem.remainingSeconds * 1000
                                      : tItem.endTimestamp,
                                }
                                : tItem
                            )
                          )
                        }
                        className="p-2 rounded-xl bg-amber-500 text-white shadow-soft"
                      >
                        {currentStepTimer.status === 'running' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startStepTimer(currentStep)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-heading font-bold text-xs shadow-soft flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{t('kitchenMode.startTimerBtn', { time: formatSeconds(currentStep.timerSeconds) })}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-surface-secondary border border-border flex items-center gap-2 text-xs text-muted font-heading">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('kitchenMode.noTimerNeeded')}</span>
                </div>
              )}

              {/* Step Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary hover:bg-surface text-foreground text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('kitchenMode.prevStep')}</span>
                </button>

                {currentStepIndex === recipe.steps.length - 1 ? (
                  <button
                    onClick={handleFinishRecipe}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-card transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{t('kitchenMode.finishRecipe')}</span>
                    <Trophy className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStepIndex((p) => Math.min(recipe.steps.length - 1, p + 1))}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-card transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{t('kitchenMode.nextStep')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE COOKING TIMERS PANEL (With Empty State) */}
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-heading font-bold text-xs text-foreground">
                <Timer className="w-4 h-4 text-primary" />
                <span>{t('kitchenMode.activeCookingTimers')}</span>
              </div>
              {activeTimers.length > 0 && (
                <button
                  onClick={() => setActiveTimers([])}
                  className="text-xs text-error hover:underline font-heading font-medium"
                >
                  {t('kitchenMode.clearAll')}
                </button>
              )}
            </div>

            {activeTimers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-secondary border border-border flex flex-col items-center justify-center text-center text-muted gap-2">
                <Clock className="w-6 h-6 opacity-40" />
                <span className="text-xs font-heading">{t('kitchenMode.noTimers')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTimers.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${item.status === 'done'
                      ? 'bg-error/10 border-error/40 text-error animate-pulse'
                      : 'bg-surface-secondary border-border'
                      }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                          {item.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.status === 'done'
                            ? 'bg-error text-white'
                            : item.status === 'running'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          {item.status === 'done'
                            ? t('kitchenMode.statusDone')
                            : item.status === 'running'
                              ? t('kitchenMode.statusRunning')
                              : t('kitchenMode.statusPaused')}
                        </span>
                      </div>
                      <div className="font-mono text-lg font-black text-primary">
                        {formatSeconds(item.remainingSeconds)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status !== 'done' && (
                        <button
                          onClick={() =>
                            setActiveTimers((prev) =>
                              prev.map((tItem) =>
                                tItem.id === item.id
                                  ? {
                                    ...tItem,
                                    status: tItem.status === 'running' ? 'paused' : 'running',
                                    endTimestamp:
                                      tItem.status === 'paused'
                                        ? Date.now() + tItem.remainingSeconds * 1000
                                        : tItem.endTimestamp,
                                  }
                                  : tItem
                              )
                            )
                          }
                          aria-label={item.status === 'running' ? 'Pause timer' : 'Play timer'}
                          className="p-2 rounded-xl bg-surface text-foreground shadow-soft hover:bg-surface-secondary transition-colors"
                        >
                          {item.status === 'running' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (item.status === 'done' && isAlarmRinging) {
                            stopAlarmAndTimers();
                          }
                          setActiveTimers((prev) => prev.filter((tItem) => tItem.id !== item.id));
                        }}
                        aria-label="Dismiss timer"
                        className="p-2 rounded-xl bg-surface text-muted hover:text-error shadow-soft transition-colors"
                        title={t('kitchenMode.dismiss')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Camera with Skeleton, Gesture Legend & Ingredients */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          {/* Camera Card */}
          <div className="rounded-3xl bg-surface border border-border shadow-card overflow-hidden">
            <div className="px-3 py-2 bg-surface-secondary border-b border-border flex items-center justify-between text-xs font-heading font-semibold">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-success animate-pulse' : 'bg-muted'
                    }`}
                />
                <span className="text-foreground text-[11px]">{cameraStatusLabel}</span>
                {isStreaming && (
                  <span
                    title={t('kitchenMode.cameraTooltip')}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 cursor-help"
                  >
                    {`Camera ${engineState.cameraFps || 30} FPS · Tracking ${engineState.fps || 0} FPS`}
                  </span>
                )}
              </div>

              <button
                onClick={() => (isStreaming ? stopCamera() : startCamera())}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${isStreaming
                  ? 'bg-error/10 text-error hover:bg-error/20 border border-error/30'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-xs'
                  }`}
              >
                {isStreaming ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{isStreaming ? t('kitchenMode.stop') : t('kitchenMode.start')}</span>
              </button>
            </div>

            <div className="p-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-surface-secondary border border-border flex items-center justify-center">
                {isStreaming ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                    />
                    <HandOverlayCanvas />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 text-muted gap-2">
                    <CameraOff className="w-6 h-6 opacity-40" />
                    <span className="text-xs">{t('kitchenMode.cameraInactive')}</span>
                    <button
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-soft"
                    >
                      {t('kitchenMode.turnOnCamera')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gesture Quick Legend (Lights up dynamically on detection) */}
            <div className="px-3 pb-3 grid grid-cols-2 gap-1.5 text-[11px] font-heading">
              <div
                className={`p-2 rounded-xl flex items-center gap-2 transition-all ${engineState.filteredGesture === 'Swipe_Right'
                  ? 'bg-primary/20 text-primary border border-primary ring-2 ring-primary/40'
                  : 'bg-surface-secondary text-muted'
                  }`}
              >
                <span>👉</span> <span>{t('kitchenMode.legendSwipeR')}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-2 transition-all ${engineState.filteredGesture === 'Swipe_Left'
                  ? 'bg-primary/20 text-primary border border-primary ring-2 ring-primary/40'
                  : 'bg-surface-secondary text-muted'
                  }`}
              >
                <span>👈</span> <span>{t('kitchenMode.legendSwipeL')}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-2 transition-all ${engineState.filteredGesture === 'Closed_Fist'
                  ? 'bg-primary/20 text-primary border border-primary ring-2 ring-primary/40'
                  : 'bg-surface-secondary text-muted'
                  }`}
              >
                <span>✊</span> <span>{t('kitchenMode.legendFist')}</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center gap-2 transition-all ${engineState.filteredGesture === 'Open_Palm'
                  ? 'bg-primary/20 text-primary border border-primary ring-2 ring-primary/40'
                  : 'bg-surface-secondary text-muted'
                  }`}
              >
                <span>✋</span> <span>{t('kitchenMode.legendPalm')}</span>
              </div>
              <div
                className={`p-2 rounded-xl col-span-2 flex items-center gap-2 transition-all ${engineState.filteredGesture === 'Victory'
                  ? 'bg-primary/20 text-primary border border-primary ring-2 ring-primary/40'
                  : 'bg-surface-secondary text-muted'
                  }`}
              >
                <span>✌️</span> <span>{t('kitchenMode.legendVictory')}</span>
              </div>
            </div>
          </div>

          {/* Ingredient Checklist */}
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {t('kitchenMode.ingredientsChecklist')}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted">
                {`${checkedCount}/${recipe.ingredients.length} ${t('kitchenMode.readyCount')}`}
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {recipe.ingredients.map((ing) => {
                const scaledAmount = Math.round(ing.amount * servingMultiplier * 10) / 10;
                const isChecked = checkedIngredients[ing.name] || false;
                return (
                  <div
                    key={ing.id}
                    onClick={() => toggleIngredientCheck(ing.name)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between text-xs ${isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-muted line-through'
                      : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted shrink-0" />
                      )}
                      <span>{ing.name}</span>
                    </div>
                    <span className="font-mono font-bold text-primary shrink-0">
                      {`${scaledAmount} ${ing.unit}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Gesture Practice Modal */}
      <KitchenPracticeModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        practiceStep={practiceStep}
        setPracticeStep={setPracticeStep}
      />
    </div>
  );
};

export default KitchenMode;
