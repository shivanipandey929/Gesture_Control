import React from 'react';

export const AuthBackgroundWaves: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. Full-viewport soft ambient background: light airy blue in light mode; deep midnight navy in dark mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7FAFF] via-[#EDF4FE] to-[#E3EFFF] dark:from-[#080F1F] dark:via-[#0B1428] dark:to-[#111C35] transition-colors duration-500" />

      {/* 2. Soft Ambient Radial Glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-blue-400/12 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[700px] h-[400px] rounded-full bg-sky-300/20 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* 3. Layered Organic Flowing Waves at the bottom (Smooth cubic bezier curves, vertical gradients = 100% seamless horizontally) */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-56 lg:h-64 overflow-hidden pointer-events-none">
        {/* Wave 1: Back Wave (Soft Pale Sky Blue) */}
        <div className="absolute bottom-0 left-0 w-[200%] h-full flex animate-wave-slow opacity-75 dark:opacity-40">
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="wave1GradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C8E4FF" stopOpacity="0.60" />
                <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.90" />
              </linearGradient>
              <linearGradient id="wave1GradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.60" />
              </linearGradient>
            </defs>
            <path
              className="fill-[url(#wave1GradLight)] dark:fill-[url(#wave1GradDark)]"
              d="M 0,160 C 240,110 480,110 720,160 C 960,210 1200,210 1440,160 L 1440,320 L 0,320 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              className="fill-[url(#wave1GradLight)] dark:fill-[url(#wave1GradDark)]"
              d="M 0,160 C 240,110 480,110 720,160 C 960,210 1200,210 1440,160 L 1440,320 L 0,320 Z"
            />
          </svg>
        </div>

        {/* Wave 2: Mid Wave (Medium Sky Blue with Phase Shift) */}
        <div className="absolute bottom-0 left-0 w-[200%] h-full flex animate-wave-mid opacity-80 dark:opacity-50">
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="wave2GradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.60" />
                <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.90" />
              </linearGradient>
              <linearGradient id="wave2GradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <path
              className="fill-[url(#wave2GradLight)] dark:fill-[url(#wave2GradDark)]"
              d="M 0,200 C 360,140 540,240 840,180 C 1140,120 1280,220 1440,200 L 1440,320 L 0,320 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              className="fill-[url(#wave2GradLight)] dark:fill-[url(#wave2GradDark)]"
              d="M 0,200 C 360,140 540,240 840,180 C 1140,120 1280,220 1440,200 L 1440,320 L 0,320 Z"
            />
          </svg>
        </div>

        {/* Wave 3: Front Wave (Vibrant Smooth Royal Blue Crest) */}
        <div className="absolute bottom-0 left-0 w-[200%] h-full flex animate-wave-fast opacity-90 dark:opacity-60">
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="wave3GradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.80" />
                <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.90" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="wave3GradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#1565C0" stopOpacity="0.65" />
              </linearGradient>
            </defs>
            <path
              className="fill-[url(#wave3GradLight)] dark:fill-[url(#wave3GradDark)]"
              d="M 0,230 C 280,180 500,270 760,220 C 1020,170 1240,260 1440,230 L 1440,320 L 0,320 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              className="fill-[url(#wave3GradLight)] dark:fill-[url(#wave3GradDark)]"
              d="M 0,230 C 280,180 500,270 760,220 C 1020,170 1240,260 1440,230 L 1440,320 L 0,320 Z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
