/**
 * Theme color constants for canvas drawing and dynamic graphics.
 * Reads runtime CSS variables with safe fallbacks.
 */

function getCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

export const CANVAS_THEME = {
  get primary(): string {
    return getCssVar('--primary', '#1D63E8');
  },
  get primaryLight(): string {
    return getCssVar('--primary-light', '#EAF0FF');
  },
  get accent(): string {
    return getCssVar('--accent', '#0E9AB8');
  },
  get success(): string {
    return getCssVar('--success', '#16A34A');
  },
  get warning(): string {
    return getCssVar('--warning', '#D97706');
  },
  get error(): string {
    return getCssVar('--error', '#DC2626');
  },
  get foreground(): string {
    return getCssVar('--foreground', '#0B1220');
  },
  get muted(): string {
    return getCssVar('--muted', '#475569');
  },
  get background(): string {
    return getCssVar('--background', '#F4F7FF');
  },
  get border(): string {
    return getCssVar('--border', '#D9E2F5');
  },
  get secondaryViolet(): string {
    return getCssVar('--secondary-violet', '#7C3AED');
  },

  // Hand skeleton joint and bone colors
  skeleton: {
    jointColor: '#00E5FF',
    boneColor: '#2979FF',
    highlightJoint: '#10B981',
    pointerRing: '#2563EB',
    laserGlow: 'rgba(29, 99, 232, 0.4)',
  },

  // Arcade & Practice arena game colors
  arcade: {
    balloonColors: ['#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
    bombColor: '#1E293B',
    fruitSliceTrail: '#38BDF8',
    targetActive: '#22C55E',
  },
};
