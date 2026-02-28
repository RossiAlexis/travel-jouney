/**
 * Spacing scale — mirrors Tailwind's default scale (1 unit = 4px).
 * All values in pixels for React Native StyleSheet compatibility.
 */

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6, // --radius-sm: calc(var(--radius) - 4px)
  md: 8, // --radius-md: calc(var(--radius) - 2px)
  lg: 10, // --radius: 0.625rem
  xl: 14, // --radius-xl: calc(var(--radius) + 4px)
  "2xl": 18,
  "3xl": 22,
  "4xl": 26,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  ring: {
    // Mimics the web app's ring/focus style
    shadowColor: "#B5B5B5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 0,
  },
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
