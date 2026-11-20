import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { SwipeDetector } from '../../engine/swipeDetector';

export interface FingerCountGameProps {
  landmarks: NormalizedLandmark[];
  onScoreUpdate: (score: number) => void;
  playSfx: (type: 'pop' | 'slice' | 'bomb' | 'cheer' | 'gameover') => void;
}

interface MathProblem {
  question: string;
  answer: number;
}

const PROBLEMS: MathProblem[] = [
  { question: '1 + 1', answer: 2 },
  { question: '2 + 1', answer: 3 },
  { question: '2 + 2', answer: 4 },
  { question: '3 + 2', answer: 5 },
  { question: '5 - 4', answer: 1 },
  { question: '4 - 2', answer: 2 },
  { question: '5 - 2', answer: 3 },
  { question: '5 - 1', answer: 4 },
  { question: '1 + 4', answer: 5 },
  { question: '3 - 2', answer: 1 },
];

export const FingerCountGame: React.FC<FingerCountGameProps> = ({
  landmarks,
  onScoreUpdate,
  playSfx,
}) => {
  const { t } = useTranslation();
  const [problemIndex, setProblemIndex] = useState<number>(0);
  const [detectedFingers, setDetectedFingers] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const matchStartRef = useRef<number | null>(null);
  const currentProblem = PROBLEMS[problemIndex % PROBLEMS.length];

  useEffect(() => {
    const count = SwipeDetector.countExtendedFingers(landmarks);
    setDetectedFingers(count);

    const now = Date.now();
    if (count === currentProblem.answer) {
      if (!matchStartRef.current) {
        matchStartRef.current = now;
      } else {
        const elapsed = now - matchStartRef.current;
        const progress = Math.min(1, elapsed / 800);
        setHoldProgress(progress);

        if (progress >= 1 && !isSuccess) {
          setIsSuccess(true);
          onScoreUpdate(100);
          setStreak((s) => s + 1);
          playSfx('cheer');

          setTimeout(() => {
            setIsSuccess(false);
            setHoldProgress(0);
            matchStartRef.current = null;
            setProblemIndex((idx) => (idx + 1) % PROBLEMS.length);
          }, 900);
        }
      }
    } else {
      matchStartRef.current = null;
      setHoldProgress(0);
    }
  }, [landmarks, currentProblem.answer, isSuccess, onScoreUpdate, playSfx]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-20 text-white select-none">
      {/* Header Banner */}
      <div className="w-full flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="font-heading font-bold text-sm">
            {t('practice.fingerCount.title', 'Finger Count Math (Kids Learning)')}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-amber-300 font-bold">
            {t('practice.fingerCount.streak', 'Streak')}: {streak} ⭐
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300">
            {t('practice.fingerCount.level', 'Question')} {problemIndex + 1}/{PROBLEMS.length}
          </span>
        </div>
      </div>

      {/* Main Learning Problem Stage */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="p-8 rounded-3xl bg-slate-900/85 border-2 border-cyan-400/30 backdrop-blur-md flex flex-col items-center gap-4 shadow-elevated">
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">
            {t('practice.fingerCount.prompt', 'Show fingers to answer:')}
          </span>
          <div className="text-5xl sm:text-6xl font-black font-heading text-white tracking-wide">
            {currentProblem.question} = <span className="text-amber-300">?</span>
          </div>

          {/* Real-time Detected Fingers Display */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-white/70 font-mono">
              {t('practice.fingerCount.detected', 'Detected Fingers')}:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    i <= detectedFingers
                      ? 'bg-cyan-400 text-slate-900 scale-110 shadow-soft'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Hold Countdown Progress Bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mt-2 p-0.5">
            <div
              style={{ width: `${holdProgress * 100}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                isSuccess ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
          </div>

          {isSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-heading font-bold text-sm animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('practice.fingerCount.correct', 'Correct! Amazing job! 🎉')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="w-full flex items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10 text-xs text-white/80">
        <span>
          💡 {t('practice.fingerCount.hint', 'Hold your hand open towards the camera with the matching number of fingers.')}
        </span>
      </div>
    </div>
  );
};
