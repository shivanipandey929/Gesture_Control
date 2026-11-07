import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Timer, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Clock, 
  Flame
} from 'lucide-react';
import { PipCamera } from '../components/common/PipCamera';

export const KitchenMode: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const steps = [
    {
      num: 1,
      title: 'Boil & Par-cook Potatoes',
      time: '12 min',
      desc: 'Place 1.5 lbs of baby Yukon gold potatoes in a pot of cold salted water. Bring to a rolling boil and simmer until fork-tender (approx. 12 minutes).',
      ingredients: ['1.5 lbs Baby Gold Potatoes', '1 tbsp Kosher Salt', '6 cups Water'],
    },
    {
      num: 2,
      title: 'Drain, Dry & Gently Smash',
      time: '3 min',
      desc: 'Drain thoroughly in a colander. Allow steam to evaporate for 3 minutes for maximum crispiness. Place on a baking sheet and gently crush with a flat cup base.',
      ingredients: ['Baking Parchment', 'Flat Measuring Cup'],
    },
    {
      num: 3,
      title: 'Truffle & Herb Basting',
      time: '2 min',
      desc: 'Generously drizzle with cold-pressed olive oil, minced fresh rosemary, flaky sea salt, black pepper, and white truffle essence.',
      ingredients: ['3 tbsp Extra Virgin Olive Oil', '2 sprigs Fresh Rosemary', '1 tsp Truffle Oil', 'Flaky Sea Salt'],
    },
    {
      num: 4,
      title: 'Roast Until Golden Crisp',
      time: '25 min',
      desc: 'Roast at 425°F (220°C) on the middle oven rack for 25 minutes until edges are deeply golden and shattering crisp. Flip once halfway.',
      ingredients: ['Preheated Oven: 425°F (220°C)'],
    },
  ];

  const triggerToast = (text: string) => {
    setActionToast(text);
    setTimeout(() => setActionToast(null), 2200);
  };

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          triggerToast('⏰ Kitchen Timer Finished!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
    triggerToast('Next Recipe Step (Swipe Right)');
  };

  const handlePrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
    triggerToast('Previous Step (Swipe Left)');
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    triggerToast('Timer Stopped (Open Palm ✋)');
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    triggerToast('Timer Started (Closed Fist ✊)');
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-300 mb-2">
            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
            <span>Touchless Kitchen Assistant • Hands-Free Culinary UX</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Crispy Truffle Smashed Potatoes
          </h1>
          <p className="text-slate-400 text-sm">
            Keep your screen clean while cooking. Open Palm stops the timer, Swipes change steps.
          </p>
        </div>

        {/* Big Kitchen Timer */}
        <div className="p-4 rounded-3xl glass-panel-glow border-2 border-cyan-500/50 bg-[#0B1020] flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Timer className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              Kitchen Timer
            </div>
            <div className="text-3xl font-mono font-extrabold text-white">
              {formatTime(timerSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => (isTimerRunning ? handleStopTimer() : handleStartTimer())}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                isTimerRunning
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}
              title={isTimerRunning ? 'Stop Timer (Open Palm)' : 'Start Timer (Fist)'}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(600);
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Toast Overlay */}
      {actionToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full glass-panel border border-cyan-400 text-cyan-300 font-heading font-bold text-sm shadow-glow-cyan">
          {actionToast}
        </div>
      )}

      {/* Main Recipe Step Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Active Step Card */}
        <div className="md:col-span-2 p-8 sm:p-12 rounded-3xl glass-panel border border-slate-800 flex flex-col justify-between gap-8 min-h-[440px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500 text-slate-950 font-heading font-extrabold flex items-center justify-center text-lg">
                {steps[currentStepIndex].num}
              </span>
              <div>
                <span className="text-xs font-mono text-slate-400">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white">
                  {steps[currentStepIndex].title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{steps[currentStepIndex].time}</span>
            </div>
          </div>

          <p className="text-lg sm:text-xl text-slate-200 leading-relaxed font-medium">
            {steps[currentStepIndex].desc}
          </p>

          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Required for this step:
            </div>
            <div className="flex flex-wrap gap-2">
              {steps[currentStepIndex].ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-300"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Step Navigation footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 font-heading text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Step
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading text-xs font-bold hover:opacity-90 disabled:opacity-40 shadow-glow-cyan"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Quick Step Overview */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4">
          <h4 className="font-heading font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Recipe Overview
          </h4>

          <div className="space-y-3">
            {steps.map((s, idx) => (
              <button
                key={s.num}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                  currentStepIndex === idx
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-glow-cyan/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{s.num}.</span>
                  <span className="font-medium truncate max-w-[150px]">{s.title}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{s.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Embedded Gesture Controller & PiP Camera */}
      <PipCamera
        onAction={(action) => {
          if (action === 'pause') handleStopTimer(); // Open Palm stops timer
          else if (action === 'play') handleStartTimer(); // Closed Fist starts timer
          else if (action === 'next') handleNextStep(); // Swipe Right advances step
          else if (action === 'previous') handlePrevStep(); // Swipe Left goes back
        }}
      />
    </div>
  );
};
