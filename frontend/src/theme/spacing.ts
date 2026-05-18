/**
 * NARI Design System — Spacing & Shape Tokens
 */

/** 4px base grid spacing scale */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

/** Border radius tokens */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,      // Primary card radius (per DESIGN.md)
  full: 9999,  // Pill buttons, avatar circles
} as const;

/** Shadow presets (iOS + Android elevation) */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  sos: {
    shadowColor: '#B22222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

/** Minimum tap target sizes (accessibility) */
export const hitSlop = {
  default: { top: 8, bottom: 8, left: 8, right: 8 },
  large: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

/** Min touchable dimensions */
export const minTouchable = {
  default: 48,   // Standard — 48dp
  sos: 64,       // SOS button — 64dp
} as const;

export type Spacing = typeof spacing;
