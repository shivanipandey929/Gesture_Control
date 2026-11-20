import React from 'react';
import type { ArcadeTab } from './PracticeTypes';

interface PracticeLobbyVisualProps {
  game: ArcadeTab;
}

export const PracticeLobbyVisual: React.FC<PracticeLobbyVisualProps> = ({ game }) => {
  return (
    <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#E8F2FF] via-[#F3F8FF] to-[#DBEBFF] dark:from-[#0B152B] dark:via-[#111E3B] dark:to-[#0A1224] flex items-center justify-center select-none border border-blue-100/70 dark:border-blue-900/40">
      {/* Soft Ambient Radial Lights */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-400/20 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-10 w-60 h-60 rounded-full bg-sky-300/30 dark:bg-blue-600/20 blur-2xl pointer-events-none" />

      {/* Subtle cloud / atmospheric wave lines at bottom */}
      <svg
        className="absolute bottom-0 inset-x-0 w-full h-24 text-white/50 dark:text-blue-950/40 pointer-events-none"
        viewBox="0 0 1000 120"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M 0,60 C 200,10 400,90 600,40 C 800,-10 900,50 1000,30 L 1000,120 L 0,120 Z" />
      </svg>

      {/* GAME 1: BALLOON POP LOBBY VISUAL */}
      {game === 'balloon' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 1. Pink Balloon Left */}
          <div className="absolute left-[10%] sm:left-[14%] top-[26%] animate-bounce [animation-duration:3.2s]">
            <div className="relative w-16 sm:w-20 h-20 sm:h-24 rounded-full bg-gradient-to-tr from-[#DB2777] via-[#EC4899] to-[#F472B6] shadow-[0_12px_24px_rgba(236,72,153,0.35)] flex items-center justify-center">
              <span className="absolute top-2 left-3 w-3 h-6 rounded-full bg-white/50 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#DB2777] w-0 h-0" />
            </div>
          </div>

          {/* 2. Yellow Balloon Left-Mid */}
          <div className="absolute left-[20%] sm:left-[24%] bottom-[20%] animate-bounce [animation-duration:3.8s] [animation-delay:0.5s]">
            <div className="relative w-14 sm:w-16 h-18 sm:h-20 rounded-full bg-gradient-to-tr from-[#D97706] via-[#F59E0B] to-[#FCD34D] shadow-[0_10px_20px_rgba(245,158,11,0.35)] flex items-center justify-center">
              <span className="absolute top-2 left-2.5 w-2.5 h-5 rounded-full bg-white/50 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#D97706] w-0 h-0" />
            </div>
          </div>

          {/* 3. Blue Balloon Mid-Left */}
          <div className="absolute left-[33%] sm:left-[36%] top-[34%] animate-bounce [animation-duration:3.5s] [animation-delay:1.1s]">
            <div className="relative w-18 sm:w-22 h-22 sm:h-26 rounded-full bg-gradient-to-tr from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] shadow-[0_12px_28px_rgba(37,99,235,0.4)] flex items-center justify-center">
              <span className="absolute top-2.5 left-3.5 w-3 h-7 rounded-full bg-white/50 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#1D4ED8] w-0 h-0" />
            </div>
          </div>

          {/* 4. Target Red Balloon Center with Bullseye Target Ripples */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Concentric Target Rings */}
            <span className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/80 animate-ping opacity-75" />
            <span className="absolute w-36 h-36 rounded-full border border-sky-400/60 animate-pulse" />
            <span className="absolute w-44 h-44 rounded-full border border-blue-400/30" />

            {/* Target Red Balloon */}
            <div className="relative w-20 sm:w-24 h-24 sm:h-28 rounded-full bg-gradient-to-tr from-[#DC2626] via-[#EF4444] to-[#F87171] shadow-[0_14px_32px_rgba(239,68,68,0.45)] flex items-center justify-center animate-pulse">
              <span className="absolute top-2.5 left-3.5 w-3.5 h-7 rounded-full bg-white/55 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#DC2626] w-0 h-0" />
            </div>
          </div>

          {/* 5. Pointing Cyber Hand Touching Target Balloon */}
          <div className="absolute top-[38%] left-[45%] sm:left-[47%] z-20 pointer-events-none transform -translate-x-1/2">
            <svg viewBox="0 0 240 180" className="w-48 sm:w-56 h-auto drop-shadow-[0_10px_25px_rgba(29,99,232,0.5)]">
              <defs>
                <linearGradient id="handGradLobby" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#2563EB" stopOpacity="0.95" />
                  <stop offset="85%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#67E8F9" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Silhouette body */}
              <path
                d="M 40,180 C 50,150 65,130 80,110 C 95,95 105,80 120,60 L 138,32 C 142,26 148,26 151,32 C 153,38 148,48 142,62 L 130,86 C 138,82 148,84 148,92 L 140,110 C 146,108 153,112 150,122 L 140,138 C 143,140 142,148 135,155 L 115,180 Z"
                fill="url(#handGradLobby)"
              />
              {/* Wireframe Mesh Lines */}
              <path
                d="M 40,180 L 80,110 M 80,110 L 120,60 M 120,60 L 138,32 M 138,32 L 151,32 M 151,32 L 130,86 M 130,86 L 148,92 M 148,92 L 140,110 M 80,110 L 130,86 M 65,130 L 140,110 M 120,60 L 148,92 M 115,180 L 140,138"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
              />
              {/* Fingertip Glow Node */}
              <circle cx="145" cy="29" r="5" fill="#FFFFFF" />
              <circle cx="145" cy="29" r="9" fill="none" stroke="#67E8F9" strokeWidth="2" className="animate-ping" />
            </svg>
          </div>

          {/* 6. Hazard Skull Bomb Right */}
          <div className="absolute right-[22%] sm:right-[26%] top-[35%] animate-bounce [animation-duration:3.6s] [animation-delay:0.3s]">
            <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#475569] shadow-[0_12px_28px_rgba(0,0,0,0.5)] border-2 border-red-500/50 flex items-center justify-center">
              <span className="text-xl sm:text-2xl select-none">💀</span>
              {/* Burning Fuse */}
              <div className="absolute -top-3.5 right-2 w-3 h-5 border-r-2 border-amber-500 rounded-tr-full">
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300" />
              </div>
            </div>
          </div>

          {/* 7. Purple Balloon Right */}
          <div className="absolute right-[12%] sm:right-[15%] top-[20%] animate-bounce [animation-duration:3.4s] [animation-delay:0.8s]">
            <div className="relative w-15 sm:w-18 h-19 sm:h-22 rounded-full bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#C4B5FD] shadow-[0_10px_22px_rgba(139,92,246,0.35)] flex items-center justify-center">
              <span className="absolute top-2 left-3 w-2.5 h-5 rounded-full bg-white/50 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#6D28D9] w-0 h-0" />
            </div>
          </div>

          {/* 8. Green Balloon Far-Right */}
          <div className="absolute right-[5%] sm:right-[8%] bottom-[22%] animate-bounce [animation-duration:3.7s] [animation-delay:1.4s]">
            <div className="relative w-14 sm:w-16 h-18 sm:h-20 rounded-full bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#6EE7B7] shadow-[0_10px_20px_rgba(16,185,129,0.35)] flex items-center justify-center">
              <span className="absolute top-2 left-2.5 w-2.5 h-5 rounded-full bg-white/50 blur-[1px]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#059669] w-0 h-0" />
            </div>
          </div>
        </div>
      )}

      {/* GAME 2: FRUIT SLASH LOBBY VISUAL */}
      {game === 'fruit' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Flying Watermelon Split */}
          <div className="relative flex items-center gap-3 animate-pulse">
            <span className="text-6xl sm:text-7xl transform -rotate-12 drop-shadow-[0_10px_20px_rgba(16,185,129,0.4)]">
              🍉
            </span>
            <div className="w-1.5 h-20 bg-gradient-to-b from-cyan-400 via-white to-blue-500 rounded-full shadow-[0_0_16px_rgba(6,182,212,1)]" />
            <span className="text-5xl sm:text-6xl transform rotate-12 drop-shadow-[0_10px_20px_rgba(239,68,68,0.4)]">
              🍎
            </span>
          </div>

          {/* Floating Orange & Banana */}
          <div className="absolute left-[16%] top-[25%] text-5xl sm:text-6xl animate-bounce [animation-duration:3s]">
            🍊
          </div>
          <div className="absolute right-[18%] bottom-[25%] text-5xl sm:text-6xl animate-bounce [animation-duration:3.4s]">
            🍌
          </div>
          <div className="absolute right-[30%] top-[20%] text-4xl sm:text-5xl animate-bounce [animation-duration:2.8s]">
            🥭
          </div>
        </div>
      )}

      {/* GAME 3: GESTURE MATCH LOBBY VISUAL */}
      {game === 'match' && (
        <div className="relative w-full h-full flex items-center justify-center gap-6">
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-card/80 border border-blue-100 dark:border-blue-900/50 shadow-card flex flex-col items-center gap-2 animate-pulse">
            <span className="text-6xl">✋</span>
            <span className="font-heading font-black text-xs text-primary uppercase tracking-wider">
              Open Palm
            </span>
          </div>
          <div className="text-2xl text-primary font-black">&harr;</div>
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-card/80 border border-blue-100 dark:border-blue-900/50 shadow-card flex flex-col items-center gap-2">
            <span className="text-6xl">✌️</span>
            <span className="font-heading font-black text-xs text-primary uppercase tracking-wider">
              Victory
            </span>
          </div>
        </div>
      )}

      {/* GAME 4: AIR DRAW LOBBY VISUAL */}
      {game === 'draw' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 400 200" className="w-full max-w-md h-auto">
            <path
              d="M 50,150 C 120,40 180,180 260,80 C 310,20 370,120 390,70"
              fill="none"
              stroke="#1D63E8"
              strokeWidth="6"
              strokeLinecap="round"
              className="drop-shadow-[0_4px_12px_rgba(29,99,232,0.4)]"
            />
            <path
              d="M 80,170 C 150,90 220,160 300,110"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="4"
              strokeLinecap="round"
              className="drop-shadow-[0_4px_10px_rgba(6,182,212,0.4)]"
            />
          </svg>
          <div className="absolute top-[32%] right-[24%] p-3 rounded-2xl bg-white dark:bg-card border border-blue-200 dark:border-blue-900 shadow-card flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <span className="text-xs font-heading font-bold text-foreground">Spatial Air Canvas</span>
          </div>
        </div>
      )}

      {/* GAME 5: ROCK PAPER SCISSORS VISUAL */}
      {game === 'rps' && (
        <div className="relative w-full h-full flex items-center justify-center gap-8">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-card/80 border border-blue-200 shadow-card">
            <span className="text-4xl">✊</span>
            <span className="text-xs font-bold text-foreground mt-1">Rock (Fist)</span>
          </div>
          <div className="text-xl font-bold text-primary">VS</div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-card/80 border border-blue-200 shadow-card">
            <span className="text-4xl">✋</span>
            <span className="text-xs font-bold text-foreground mt-1">Paper (Palm)</span>
          </div>
          <div className="text-xl font-bold text-primary">VS</div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-card/80 border border-blue-200 shadow-card">
            <span className="text-4xl">✌️</span>
            <span className="text-xs font-bold text-foreground mt-1">Scissors (Victory)</span>
          </div>
        </div>
      )}

      {/* GAME 6: FINGER COUNT VISUAL */}
      {game === 'count' && (
        <div className="relative w-full h-full flex items-center justify-center gap-6">
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-card/90 border border-blue-200 shadow-card flex items-center gap-4">
            <span className="text-5xl">🖐️</span>
            <div>
              <div className="text-xl font-bold text-primary">1, 2, 3, 4, 5</div>
              <div className="text-xs text-muted">Hold up fingers to count and solve questions!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
