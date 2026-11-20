import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Flame, RotateCcw, Award } from 'lucide-react';

export interface RpsGameProps {
  currentGesture: string;
  onScoreUpdate: (score: number) => void;
  playSfx: (type: 'pop' | 'slice' | 'bomb' | 'cheer' | 'gameover') => void;
}

type Choice = 'Rock' | 'Paper' | 'Scissors';

export const RpsGame: React.FC<RpsGameProps> = ({ currentGesture, onScoreUpdate, playSfx }) => {
  const { t } = useTranslation();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [round, setRound] = useState<number>(1);
  const [playerWins, setPlayerWins] = useState<number>(0);
  const [computerWins, setComputerWins] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [totalVictories, setTotalVictories] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string>('Ready');

  const gestureToChoice = (g: string): Choice | null => {
    if (g === 'Closed_Fist') return 'Rock';
    if (g === 'Open_Palm') return 'Paper';
    if (g === 'Victory') return 'Scissors';
    return null;
  };

  const choices: Choice[] = ['Rock', 'Paper', 'Scissors'];
  const choiceIcons: Record<Choice, string> = {
    Rock: '✊',
    Paper: '✋',
    Scissors: '✌️',
  };

  const playRound = () => {
    if (isCountingDown) return;
    setIsCountingDown(true);
    setPlayerChoice(null);
    setComputerChoice(null);
    setRoundResult(null);

    const steps = ['Rock...', 'Paper...', 'Scissors...', 'Shoot!'];
    let stepIndex = 0;
    setCountdownText(steps[0]);

    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setCountdownText(steps[stepIndex]);
      } else {
        clearInterval(interval);
        setIsCountingDown(false);

        // Evaluate choices
        const pChoice = gestureToChoice(currentGesture) || choices[Math.floor(Math.random() * 3)];
        const cChoice = choices[Math.floor(Math.random() * 3)];
        setPlayerChoice(pChoice);
        setComputerChoice(cChoice);

        const isWin =
          (pChoice === 'Rock' && cChoice === 'Scissors') ||
          (pChoice === 'Paper' && cChoice === 'Rock') ||
          (pChoice === 'Scissors' && cChoice === 'Paper');
        const outcome: 'win' | 'lose' | 'draw' = pChoice === cChoice ? 'draw' : isWin ? 'win' : 'lose';

        if (outcome === 'draw') {
          setRoundResult('draw');
          playSfx('pop');
        } else if (outcome === 'win') {
          setRoundResult('win');
          setPlayerWins((w) => w + 1);
          setStreak((s) => s + 1);
          onScoreUpdate(100);
          playSfx('cheer');
        } else {
          setRoundResult('lose');
          setComputerWins((w) => w + 1);
          setStreak(0);
          playSfx('bomb');
        }

        setRound((r) => {
          const nextR = r + 1;
          const nextPW = outcome === 'win' ? playerWins + 1 : playerWins;
          const nextCW = outcome === 'lose' ? computerWins + 1 : computerWins;
          if (nextPW >= 3 || nextCW >= 3 || nextR > 5) {
            setTotalGames((g) => g + 1);
            if (nextPW > nextCW) setTotalVictories((v) => v + 1);
          }
          return nextR;
        });
      }
    }, 700);
  };

  const isMatchOver = playerWins >= 3 || computerWins >= 3 || round > 5;

  const resetMatch = () => {
    setRound(1);
    setPlayerWins(0);
    setComputerWins(0);
    setPlayerChoice(null);
    setComputerChoice(null);
    setRoundResult(null);
  };

  const winRate = totalGames > 0 ? Math.round((totalVictories / totalGames) * 100) : 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-20 text-white select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-heading font-bold text-sm">
            {t('practice.rps.title', 'Rock Paper Scissors (Best of 5)')}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-mono">
            {t('practice.rps.round', 'Round')} {Math.min(5, round)}/5
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Flame className="w-4 h-4" />
            <span>{streak} {t('practice.rps.streak', 'streak')}</span>
          </div>
          <div className="text-emerald-400">
            {t('practice.rps.winRate', 'Win rate')}: {winRate}%
          </div>
        </div>
      </div>

      {/* Main Duel Stage */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-6">
        {isMatchOver ? (
          <div className="text-center space-y-4 bg-slate-900/90 border border-white/20 p-8 rounded-3xl backdrop-blur-lg animate-in zoom-in-95">
            <Award className="w-16 h-16 mx-auto text-amber-400 animate-bounce" />
            <h2 className="text-2xl font-heading font-black">
              {playerWins > computerWins
                ? t('practice.rps.matchWon', 'You Won the Match! 🎉')
                : t('practice.rps.matchLost', 'Computer Won the Match!')}
            </h2>
            <p className="text-sm font-mono text-white/80">
              {t('practice.rps.finalScore', 'Final Score')}: {playerWins} - {computerWins}
            </p>
            <button
              onClick={resetMatch}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-heading font-bold text-sm text-white shadow-card flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('practice.rps.playAgain', 'Play Again')}</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg flex items-center justify-between gap-6">
            {/* Player Side */}
            <div className="flex-1 flex flex-col items-center gap-3 bg-black/40 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
              <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold">
                {t('practice.rps.you', 'You')}
              </span>
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-5xl">
                {playerChoice ? choiceIcons[playerChoice] : gestureToChoice(currentGesture) ? choiceIcons[gestureToChoice(currentGesture)!] : '❓'}
              </div>
              <span className="font-heading font-bold text-sm">
                {playerChoice || gestureToChoice(currentGesture) || t('practice.rps.showGesture', 'Show Gesture')}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {playerWins} {t('practice.rps.wins', 'wins')}
              </span>
            </div>

            {/* VS Badge / Countdown */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-black font-heading tracking-widest text-white/90">
                {isCountingDown ? countdownText : 'VS'}
              </span>
              {roundResult && !isCountingDown && (
                <span
                  className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    roundResult === 'win'
                      ? 'bg-emerald-500/80 text-white'
                      : roundResult === 'lose'
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-amber-500/80 text-white'
                  }`}
                >
                  {roundResult === 'win'
                    ? t('practice.rps.roundWon', 'Point to You!')
                    : roundResult === 'lose'
                    ? t('practice.rps.roundLost', 'Computer Point')
                    : t('practice.rps.tie', 'Tie / Draw')}
                </span>
              )}
            </div>

            {/* Computer Side */}
            <div className="flex-1 flex flex-col items-center gap-3 bg-black/40 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
              <span className="text-xs uppercase tracking-wider text-rose-300 font-bold">
                {t('practice.rps.computer', 'Computer')}
              </span>
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-5xl">
                {computerChoice ? choiceIcons[computerChoice] : '🤖'}
              </div>
              <span className="font-heading font-bold text-sm">
                {computerChoice || t('practice.rps.waiting', 'Waiting...')}
              </span>
              <span className="text-xs font-mono text-rose-400 font-bold">
                {computerWins} {t('practice.rps.wins', 'wins')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls & Gesture Legend */}
      <div className="w-full flex items-center justify-between gap-4 bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
        <div className="flex items-center gap-4 text-xs">
          <span>✊ = {t('practice.rps.rock', 'Rock')}</span>
          <span>✋ = {t('practice.rps.paper', 'Paper')}</span>
          <span>✌️ = {t('practice.rps.scissors', 'Scissors')}</span>
        </div>

        {!isMatchOver && (
          <button
            onClick={playRound}
            disabled={isCountingDown}
            className="px-5 py-2 rounded-xl bg-[#1D63E8] hover:bg-[#1554c9] disabled:opacity-50 text-white font-heading font-bold text-xs shadow-soft transition-all"
          >
            {isCountingDown ? t('practice.rps.shooting', 'Shoot...') : t('practice.rps.playShoot', 'Play (Shoot!)')}
          </button>
        )}
      </div>
    </div>
  );
};
