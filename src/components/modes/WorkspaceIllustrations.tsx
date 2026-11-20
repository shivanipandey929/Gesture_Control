import React from 'react';

// 1. Presentation Workspace Illustration (Slide deck with bar chart)
export const PresentationIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="presCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDF4FE" />
        </linearGradient>
        <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Background slide frame */}
      <rect x="8" y="6" width="112" height="76" rx="14" fill="url(#presCardGrad)" stroke="#BFDBFE" strokeWidth="1.5" />
      {/* Top Header Bar */}
      <rect x="18" y="18" width="45" height="5" rx="2.5" fill="#93C5FD" opacity="0.8" />
      <rect x="18" y="27" width="28" height="3" rx="1.5" fill="#BFDBFE" />

      {/* Bar Chart Grid Line */}
      <line x1="72" y1="64" x2="110" y2="64" stroke="#DBEAFE" strokeWidth="1.5" strokeLinecap="round" />

      {/* Ascending Chart Bars */}
      <rect x="75" y="44" width="7" height="20" rx="3.5" fill="url(#barGrad1)" />
      <rect x="87" y="32" width="7" height="32" rx="3.5" fill="url(#barGrad2)" />
      <rect x="99" y="22" width="7" height="42" rx="3.5" fill="#1D63E8" />
    </svg>
  </div>
);

// 2. Media Player Workspace Illustration (Video player + play button + clapper)
export const MediaIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="mediaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Main Video Canvas Screen */}
      <rect x="10" y="8" width="100" height="66" rx="14" fill="url(#mediaGrad)" />
      {/* Ambient glass sheen */}
      <path d="M 10,18 Q 60,35 110,24 L 110,8 Q 60,8 10,8 Z" fill="#FFFFFF" opacity="0.18" />

      {/* Glowing Circular Glass Play Button */}
      <circle cx="60" cy="41" r="15" fill="#FFFFFF" opacity="0.95" />
      <polygon points="56,33 69,41 56,49" fill="#4F46E5" />

      {/* Clapperboard Badge in bottom-right */}
      <g transform="translate(82, 46)">
        <rect x="0" y="8" width="34" height="26" rx="6" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1" />
        <rect x="0" y="0" width="34" height="8" rx="3" fill="#312E81" />
        {/* Striped clapper top */}
        <polygon points="5,0 9,0 4,8 0,8" fill="#FFFFFF" />
        <polygon points="15,0 19,0 14,8 10,8" fill="#FFFFFF" />
        <polygon points="25,0 29,0 24,8 20,8" fill="#FFFFFF" />
      </g>
    </svg>
  </div>
);

// 3. Smart Reader Workspace Illustration (Article document + vertical auto-scroll arrows)
export const ReaderIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0FDF4" />
        </linearGradient>
      </defs>

      {/* Document page */}
      <rect x="14" y="8" width="76" height="72" rx="12" fill="url(#docGrad)" stroke="#BBF7D0" strokeWidth="1.5" />
      {/* Text placeholder lines */}
      <rect x="24" y="20" width="46" height="5" rx="2.5" fill="#86EFAC" opacity="0.9" />
      <rect x="24" y="31" width="56" height="3" rx="1.5" fill="#D1FAE5" />
      <rect x="24" y="40" width="50" height="3" rx="1.5" fill="#D1FAE5" />
      <rect x="24" y="49" width="42" height="3" rx="1.5" fill="#D1FAE5" />
      <rect x="24" y="58" width="34" height="3" rx="1.5" fill="#D1FAE5" />

      {/* Vertical Auto-Scroll Dual Arrows on right */}
      <g transform="translate(104, 18)">
        {/* Connecting line */}
        <line x1="6" y1="8" x2="6" y2="44" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        {/* Up arrow */}
        <polygon points="6,0 1,8 11,8" fill="#10B981" />
        {/* Down arrow */}
        <polygon points="6,52 1,44 11,44" fill="#10B981" />
      </g>
    </svg>
  </div>
);

// 4. Virtual Pointer Workspace Illustration (Target ripple + glowing blue pointer arrow)
export const PointerIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="targetGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Target concentric ripple rings */}
      <circle cx="56" cy="44" r="36" fill="url(#targetGrad)" />
      <circle cx="56" cy="44" r="30" stroke="#BAE6FD" strokeWidth="1.2" strokeDasharray="3 3" />
      <circle cx="56" cy="44" r="18" stroke="#38BDF8" strokeWidth="1.5" />
      <circle cx="56" cy="44" r="7" fill="#0284C7" opacity="0.3" />

      {/* Glowing 3D Virtual Pointer Cursor Arrow */}
      <g transform="translate(48, 28) rotate(-15)">
        <polygon
          points="14,4 14,38 23,28 36,36 40,28 27,21 38,14"
          fill="#1D63E8"
          stroke="#93C5FD"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Cursor inner highlight */}
        <polygon points="17,10 17,32 23,26 31,31 33,27 24,21 32,16" fill="#38BDF8" opacity="0.9" />
      </g>
    </svg>
  </div>
);

// 5. Kitchen Assistant Workspace Illustration (Chef hat + golden stopwatch timer)
export const KitchenIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Chef Hat on Left */}
      <g transform="translate(16, 12)">
        {/* Hat Puffs */}
        <circle cx="28" cy="22" r="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="14" cy="26" r="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="42" cy="26" r="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        {/* Hat Base Band */}
        <rect x="8" y="38" width="40" height="12" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Band blue stripe */}
        <line x1="12" y1="44" x2="44" y2="44" stroke="#60A5FA" strokeWidth="1.5" />
      </g>

      {/* Golden Kitchen Timer on Right */}
      <g transform="translate(68, 22)">
        {/* Timer top button */}
        <rect x="18" y="0" width="8" height="5" rx="2" fill="#D97706" />
        {/* Timer Outer Dial */}
        <circle cx="22" cy="24" r="22" fill="url(#timerGrad)" stroke="#B45309" strokeWidth="1.5" />
        {/* Dial Face */}
        <circle cx="22" cy="24" r="17" fill="#FFFFFF" />
        {/* Tick marks */}
        <line x1="22" y1="10" x2="22" y2="13" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="36" y1="24" x2="33" y2="24" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="38" x2="22" y2="35" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="24" x2="11" y2="24" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        {/* Needle hand pointing to 10 o'clock */}
        <line x1="22" y1="24" x2="15" y2="16" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="24" r="2.5" fill="#1F2937" />
      </g>
    </svg>
  </div>
);

// 6. Skill Practice Workspace Illustration (Colorful balloons + bullseye target)
export const PracticeIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-28 h-20 sm:w-32 sm:h-22 flex items-center justify-center shrink-0 select-none ${className}`}>
    <svg viewBox="0 0 128 88" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="balloonPurple" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </radialGradient>
        <radialGradient id="balloonBlue" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </radialGradient>
        <radialGradient id="balloonOrange" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#EA580C" />
        </radialGradient>
      </defs>

      {/* Balloon 1: Purple on left */}
      <g transform="translate(18, 16)">
        <ellipse cx="14" cy="18" rx="14" ry="17" fill="url(#balloonPurple)" />
        <polygon points="14,35 11,38 17,38" fill="#7E22CE" />
        <path d="M 14,38 Q 12,48 18,56" stroke="#A855F7" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Balloon gloss */}
        <ellipse cx="10" cy="12" rx="4" ry="6" fill="#FFFFFF" opacity="0.35" />
      </g>

      {/* Balloon 2: Royal Blue in Center (Elevated) */}
      <g transform="translate(44, 4)">
        <ellipse cx="16" cy="20" rx="16" ry="19" fill="url(#balloonBlue)" />
        <polygon points="16,39 13,42 19,42" fill="#1D4ED8" />
        <path d="M 16,42 Q 20,54 14,64" stroke="#60A5FA" strokeWidth="1" fill="none" opacity="0.6" />
        <ellipse cx="11" cy="13" rx="5" ry="7" fill="#FFFFFF" opacity="0.4" />
      </g>

      {/* Balloon 3: Orange on right */}
      <g transform="translate(74, 20)">
        <ellipse cx="14" cy="17" rx="14" ry="16" fill="url(#balloonOrange)" />
        <polygon points="14,33 11,36 17,36" fill="#EA580C" />
        <path d="M 14,36 Q 16,46 10,54" stroke="#FB923C" strokeWidth="1" fill="none" opacity="0.6" />
        <ellipse cx="10" cy="11" rx="4" ry="5" fill="#FFFFFF" opacity="0.35" />
      </g>

      {/* Crosshair Target Reticle at bottom right */}
      <g transform="translate(72, 48)">
        <circle cx="20" cy="20" r="14" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="20" cy="20" r="7" stroke="#DC2626" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="2.5" fill="#DC2626" />
        <line x1="20" y1="2" x2="20" y2="8" stroke="#DC2626" strokeWidth="1.5" />
        <line x1="20" y1="32" x2="20" y2="38" stroke="#DC2626" strokeWidth="1.5" />
        <line x1="2" y1="20" x2="8" y2="20" stroke="#DC2626" strokeWidth="1.5" />
        <line x1="32" y1="20" x2="38" y2="20" stroke="#DC2626" strokeWidth="1.5" />
      </g>
    </svg>
  </div>
);
