/**
 * NARI Design System — Typography Tokens
 * Source of truth: docs/DESIGN.md
 *
 * Fonts:
 *   Plus Jakarta Sans — Hero/Headers (weights: 700, 600)
 *   Manrope          — Body/UI (weights: 400, 500, 600, 700)
 *   JetBrains Mono   — Technical/Sensor data (weight: 400)
 *
 * We load these via expo-font. Until fonts load we fall back to system.
 */

export const fontFamilies = {
  heading: 'PlusJakartaSans-Bold',
  headingSemibold: 'PlusJakartaSans-SemiBold',
  body: 'Manrope-Regular',
  bodyMedium: 'Manrope-Medium',
  bodySemibold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
  mono: 'JetBrainsMono-Regular',
} as const;

/**
 * Font size scale — relative sizing for accessibility.
 * All values in logical pixels; RN handles density scaling.
 */
export const fontSizes = {
  hero: 32,       // Splash wordmark, SOS countdown number
  h1: 28,         // Screen titles ("Home", "Status")
  h2: 22,         // Section headers ("Recent Alerts")
  h3: 18,         // Card titles
  body: 16,       // Primary body text
  bodySmall: 14,  // Secondary body, captions
  caption: 12,    // Timestamps, labels
  micro: 10,      // Badge text, connectivity dots
} as const;

/**
 * Line heights for each font size.
 */
export const lineHeights = {
  hero: 40,
  h1: 36,
  h2: 28,
  h3: 24,
  body: 24,
  bodySmall: 20,
  caption: 16,
  micro: 14,
} as const;

/**
 * Pre-composed text style presets.
 * Import and spread into StyleSheet: { ...typography.h1 }
 */
export const typography = {
  hero: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.hero,
    lineHeight: lineHeights.hero,
  },
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.h1,
  },
  h2: {
    fontFamily: fontFamilies.headingSemibold,
    fontSize: fontSizes.h2,
    lineHeight: lineHeights.h2,
  },
  h3: {
    fontFamily: fontFamilies.headingSemibold,
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  bodySemibold: {
    fontFamily: fontFamilies.bodySemibold,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodySmall,
    lineHeight: lineHeights.bodySmall,
  },
  bodySmallMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.bodySmall,
    lineHeight: lineHeights.bodySmall,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  captionMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.bodySmall,
    lineHeight: lineHeights.bodySmall,
  },
  monoSmall: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
} as const;

export type Typography = typeof typography;
