import React from 'react';

export const ModesHeroVisual: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Ambient Background Glows */}
      <div className="absolute w-64 h-64 rounded-full bg-primary/15 dark:bg-cyan-500/15 blur-3xl" />
      <div className="absolute w-48 h-48 rounded-full bg-sky-400/20 dark:bg-blue-600/20 blur-2xl translate-x-8 -translate-y-8" />

      {/* 2. Concentric Ripple Waves at the Index Fingertip */}
      <div className="absolute top-[34px] right-[128px] sm:top-[38px] sm:right-[145px] z-10 flex items-center justify-center">
        {/* Ripple Ring 1 */}
        <span className="absolute w-12 h-12 rounded-full border border-cyan-400/80 animate-ping opacity-75" />
        {/* Ripple Ring 2 */}
        <span className="absolute w-20 h-20 rounded-full border border-sky-400/60 animate-pulse" />
        {/* Ripple Ring 3 */}
        <span className="absolute w-32 h-32 rounded-full border border-blue-400/40" />
        {/* Ripple Ring 4 (Large Faint) */}
        <span className="absolute w-44 h-44 rounded-full border border-blue-300/20" />
        {/* Center Glow Dot */}
        <span className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(56,189,248,1)]" />
      </div>

      {/* 3. Holographic Pointing Hand Silhouette & Wireframe Mesh */}
      <svg
        viewBox="0 0 360 260"
        className="w-full max-w-[340px] sm:max-w-[400px] h-auto drop-shadow-[0_10px_30px_rgba(29,99,232,0.45)]"
        fill="none"
      >
        <defs>
          <linearGradient id="handGradModes" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#2563EB" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#67E8F9" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="meshGradModes" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Hand Silhouette Body (Pointing Pose angled upward-right) */}
        <path
          d="M 60,260 
             C 75,230 95,200 120,175 
             C 135,160 150,150 168,145 
             C 172,130 182,105 198,72 
             C 206,56 215,40 224,36 
             C 232,32 240,36 242,46 
             C 244,56 238,82 230,110 
             L 225,125 
             C 240,128 252,138 252,150 
             C 252,158 246,166 238,170 
             C 245,174 249,182 248,190 
             C 247,198 240,206 232,210 
             C 238,215 240,222 238,230 
             C 236,240 225,250 210,260 
             Z"
          fill="url(#handGradModes)"
          stroke="#93C5FD"
          strokeWidth="1.2"
        />

        {/* Thumb curled inward */}
        <path
          d="M 120,175 C 135,165 155,165 172,175 C 180,180 185,190 178,200 C 168,212 150,215 135,210 Z"
          fill="#1D4ED8"
          stroke="#7DD3FC"
          strokeWidth="1.0"
        />

        {/* Curled Middle, Ring, Pinky Knuckles & Pads */}
        <path
          d="M 195,140 C 215,138 238,145 240,156 C 242,168 225,178 205,176 Z"
          fill="#2563EB"
          stroke="url(#meshGradModes)"
          strokeWidth="1.0"
        />
        <path
          d="M 190,176 C 210,175 235,182 236,192 C 237,204 220,212 200,210 Z"
          fill="#1D4ED8"
          stroke="url(#meshGradModes)"
          strokeWidth="1.0"
        />
        <path
          d="M 185,210 C 205,210 226,218 226,228 C 226,238 210,248 190,244 Z"
          fill="#1E3A8A"
          stroke="url(#meshGradModes)"
          strokeWidth="1.0"
        />

        {/* 3D Wireframe Polygon Mesh Lines */}
        <g stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
          {/* Index Finger Bone Triangles */}
          <line x1="168" y1="145" x2="198" y2="72" />
          <line x1="198" y1="72" x2="224" y2="36" />
          <line x1="168" y1="145" x2="225" y2="125" />
          <line x1="198" y1="72" x2="225" y2="125" />
          <line x1="224" y1="36" x2="230" y2="110" />
          <line x1="198" y1="72" x2="230" y2="110" />

          {/* Palm Triangulation Lines */}
          <line x1="120" y1="175" x2="168" y2="145" />
          <line x1="120" y1="175" x2="175" y2="200" />
          <line x1="168" y1="145" x2="205" y2="176" />
          <line x1="175" y1="200" x2="205" y2="176" />
          <line x1="175" y1="200" x2="200" y2="210" />
          <line x1="135" y1="210" x2="185" y2="244" />
          <line x1="60" y1="260" x2="120" y2="175" />
          <line x1="60" y1="260" x2="135" y2="210" />
          <line x1="135" y1="210" x2="210" y2="260" />
        </g>

        {/* Glowing Node Joint Dots */}
        <g fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)">
          <circle cx="224" cy="36" r="4.5" />  {/* Index Tip (Touch Point) */}
          <circle cx="210" cy="54" r="3.2" />
          <circle cx="198" cy="72" r="3.2" />
          <circle cx="168" cy="145" r="3.5" />
          <circle cx="225" cy="125" r="3.0" />
          <circle cx="230" cy="110" r="3.0" />
          <circle cx="120" cy="175" r="3.5" />
          <circle cx="175" cy="200" r="3.0" />
          <circle cx="205" cy="176" r="3.0" />
          <circle cx="200" cy="210" r="2.8" />
          <circle cx="185" cy="244" r="2.8" />
        </g>

        {/* Floating Sparkle Stars */}
        <g fill="#FFFFFF">
          <path d="M 120,80 Q 123,87 130,90 Q 123,93 120,100 Q 117,93 110,90 Q 117,87 120,80 Z" opacity="0.8" />
          <path d="M 270,95 Q 272,99 277,101 Q 272,103 270,107 Q 268,103 263,101 Q 268,99 270,95 Z" opacity="0.9" />
          <path d="M 290,180 Q 292,184 297,186 Q 292,188 290,192 Q 288,188 283,186 Q 288,184 290,180 Z" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
};

export default ModesHeroVisual;
