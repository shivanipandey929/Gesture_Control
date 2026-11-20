import React from 'react';

export interface PopEffect {
  id: number;
  x: number; // percentage
  y: number; // percentage
  text: string;
  color: string;
}

interface PracticePopParticlesProps {
  effects: PopEffect[];
}

export const PracticePopParticles: React.FC<PracticePopParticlesProps> = ({ effects }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {effects.map((ef) => (
        <div
          key={ef.id}
          style={{ left: `${ef.x}%`, top: `${ef.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-out fade-out zoom-out-95 slide-out-to-top-8 duration-700"
        >
          {/* Expanding Particle Shockwave Ring */}
          <span
            style={{ borderColor: ef.color }}
            className="w-16 h-16 rounded-full border-2 animate-ping opacity-80"
          />

          {/* Floating Score Tag */}
          <span
            style={{
              color: ef.color,
              textShadow: `0 0 16px ${ef.color}88, 0 2px 4px rgba(0,0,0,0.25)`,
            }}
            className="font-heading font-black text-2xl sm:text-3xl tracking-tight -mt-8"
          >
            {ef.text}
          </span>
        </div>
      ))}
    </div>
  );
};
