/**
 * NARI Design System — Color Tokens
 * Source of truth: docs/DESIGN.md
 *
 * Palette: "Soft Humanist" — warm neutrals, sage safety,
 * amber caution, crimson danger.
 */

export const colors = {
  /* ───── Brand ───── */
  brand: {
    primary: '#3A5A40',     // Deep Forest — primary CTA, SOS ring idle
    secondary: '#588157',   // Sage — positive/safe indicators
    accent: '#A3B18A',      // Moss — subtle highlights, icon tints
    cream: '#FCF9F2',       // Warm Cream — primary background
    linen: '#F5F0E8',       // Linen — card surfaces
    sand: '#E8E0D4',        // Sand — dividers, secondary surface
  },

  /* ───── Semantic / Status ───── */
  status: {
    safe: '#588157',        // Sage Green
    safeLight: '#EDF3EB',   // Background tint for safe state
    alert: '#DAA520',       // Amber
    alertLight: '#FDF5E0',  // Background tint for alert state
    danger: '#B22222',      // Crimson
    dangerLight: '#FCEAEA', // Background tint for danger state / SOS bg
  },

  /* ───── Neutral ───── */
  neutral: {
    900: '#1A1A1A',         // Primary text
    700: '#4A4A4A',         // Secondary text
    500: '#8A8A8A',         // Tertiary / placeholder text
    400: '#ABABAB',         // Disabled text
    300: '#D1D1D1',         // Borders
    200: '#E8E8E8',         // Dividers
    100: '#F5F5F5',         // Subtle background
    50: '#FAFAFA',          // Near-white
    0: '#FFFFFF',           // White
  },

  /* ───── Utility ───── */
  utility: {
    info: '#2D6A9F',
    infoLight: '#E8F1F8',
    success: '#588157',
    successLight: '#EDF3EB',
    warning: '#DAA520',
    warningLight: '#FDF5E0',
    error: '#B22222',
    errorLight: '#FCEAEA',
  },

  /* ───── Overlay & Glass ───── */
  overlay: {
    black50: 'rgba(0,0,0,0.50)',
    black30: 'rgba(0,0,0,0.30)',
    black10: 'rgba(0,0,0,0.10)',
    white80: 'rgba(255,255,255,0.80)',
    white60: 'rgba(255,255,255,0.60)',
    white40: 'rgba(255,255,255,0.40)',
  },

  /* ───── Connectivity dot colors ───── */
  connectivity: {
    gps: '#588157',         // Green = active
    ble: '#588157',
    net: '#588157',
    inactive: '#D1D1D1',    // Grey = not connected
  },

  /* ───── Badge ───── */
  badge: {
    nari: '#3A5A40',        // NARI user badge bg
    nariFg: '#FFFFFF',
    sms: '#E8E0D4',         // SMS fallback badge bg
    smsFg: '#4A4A4A',
    resolved: '#A8D5BA',    // Outcome chip — resolved
    resolvedFg: '#2D5A3D',
    falseAlarm: '#E8E0D4',
    falseAlarmFg: '#4A4A4A',
  },
} as const;

export type Colors = typeof colors;
