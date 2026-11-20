import React from 'react';

export const AnalyticsHeroVisual: React.FC = () => {
  return (
    <div className="relative w-full sm:w-[480px] h-[180px] sm:h-[200px] flex items-center justify-end select-none pointer-events-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-16 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-400/20 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-36 w-44 h-44 rounded-full bg-sky-300/25 dark:bg-blue-600/20 blur-2xl pointer-events-none" />

      {/* Floating 3D Holographic Glass Tablet with Chart */}
      <div className="relative z-10 w-[200px] sm:w-[230px] h-[130px] sm:h-[145px] rounded-2xl bg-gradient-to-br from-white/70 via-white/50 to-blue-50/40 dark:from-[#1E293B]/80 dark:via-[#152342]/70 dark:to-[#0D182E]/60 backdrop-blur-xl border border-white/80 dark:border-blue-400/40 shadow-[0_16px_36px_rgba(29,99,232,0.2)] p-3 flex flex-col justify-between transform -rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Tablet Top Bar: window dots + live pulse */}
        <div className="flex items-center justify-between pb-1.5 border-b border-blue-100/60 dark:border-blue-800/40">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400/80" />
            <span className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[9px] font-bold text-primary dark:text-sky-300">LIVE SYNC</span>
          </div>
        </div>

        {/* Rising Line Chart + Bars inside Glass Tablet */}
        <div className="relative flex-1 flex items-end justify-between px-1 pt-2">
          {/* Neon Upward Trend Line */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 200 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tabletLineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#2563EB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M 10,65 Q 45,55 70,40 T 130,28 T 185,12"
              fill="none"
              stroke="url(#tabletLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Pulsing Target Dot on Peak */}
            <circle cx="185" cy="12" r="3.5" fill="#10B981" />
            <circle cx="185" cy="12" r="6.5" fill="none" stroke="#34D399" strokeWidth="1.5" className="animate-ping" />
          </svg>

          {/* 5 Rising 3D-effect Bar Chart Columns */}
          <div className="w-4 h-[35%] rounded-t-md bg-gradient-to-t from-blue-500/30 to-blue-400/60 dark:from-blue-600/40 dark:to-cyan-400/70" />
          <div className="w-4 h-[50%] rounded-t-md bg-gradient-to-t from-blue-500/40 to-blue-400/75 dark:from-blue-600/50 dark:to-cyan-400/80" />
          <div className="w-4 h-[42%] rounded-t-md bg-gradient-to-t from-blue-500/35 to-blue-400/70 dark:from-blue-600/45 dark:to-cyan-400/75" />
          <div className="w-4 h-[68%] rounded-t-md bg-gradient-to-t from-blue-500/50 to-indigo-500/85 dark:from-blue-600/60 dark:to-indigo-400/90" />
          <div className="w-4 h-[90%] rounded-t-md bg-gradient-to-t from-emerald-500/50 to-teal-400/90 dark:from-emerald-600/60 dark:to-teal-300/95 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* Holographic Digital Hand Pointing at Glass Tablet */}
      <div className="absolute right-[170px] sm:right-[195px] top-[15px] sm:top-[20px] z-20 pointer-events-none transform scale-90 sm:scale-100">
        <svg viewBox="0 0 200 160" className="w-40 sm:w-48 h-auto drop-shadow-[0_8px_20px_rgba(29,99,232,0.45)]">
          <defs>
            <linearGradient id="cyberHandGrad" x1="0%" y1="100%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#2563EB" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Hand Silhouette */}
          <path
            d="M 20,150 C 35,125 50,110 65,95 C 80,80 95,65 115,48 L 140,24 C 144,19 150,20 152,25 C 154,30 148,38 142,48 L 126,68 C 134,64 142,66 142,73 L 133,90 C 139,88 145,92 142,100 L 132,115 C 135,116 135,123 129,129 L 105,150 Z"
            fill="url(#cyberHandGrad)"
          />

          {/* Wireframe Matrix Mesh */}
          <path
            d="M 20,150 L 65,95 M 65,95 L 115,48 M 115,48 L 140,24 M 140,24 L 152,25 M 152,25 L 126,68 M 126,68 L 142,73 M 142,73 L 133,90 M 65,95 L 126,68 M 50,110 L 133,90 M 115,48 L 142,73 M 105,150 L 132,115"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
          />

          {/* Fingertip Contact Point & Rings */}
          <circle cx="146" cy="22" r="4.5" fill="#FFFFFF" />
          <circle cx="146" cy="22" r="8" fill="none" stroke="#38BDF8" strokeWidth="1.8" className="animate-ping" />
          <circle cx="146" cy="22" r="14" fill="none" stroke="#67E8F9" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
        </svg>
      </div>

      {/* Radiant concentric contact ripples touching the tablet */}
      <span className="absolute top-[35px] sm:top-[42px] right-[165px] sm:right-[190px] z-10 w-10 h-10 rounded-full border border-cyan-400/60 animate-ping pointer-events-none" />
    </div>
  );
};
