/**
 * Typography tokens matching the web app.
 *
 * The web app uses JetBrains Mono Variable for ALL text (overriding
 * --font-sans with the mono font). We mirror this distinctive choice.
 *
 * Font sizes and line heights mirror Tailwind's default scale but calibrated
 * for mobile reading at standard device densities.
 */

export const fontFamilies = {
  // Primary — JetBrains Mono (matches web app's --font-sans override)
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",

  // Fallbacks
  system: "System",
  monospace: "monospace",
} as const;

export const fontSizes = {
  xs: 12,
  sm: 13,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 30,
  "5xl": 36,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 18,
  base: 20,
  lg: 24,
  xl: 28,
  "2xl": 28,
  "3xl": 32,
  "4xl": 36,
  "5xl": 40,
} as const;

export const fontWeights = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
} as const;

export const letterSpacings = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

/**
 * Semantic text styles for consistent usage across components.
 * Use these via the Typography component.
 */
export const textStyles = {
  h1: {
    fontSize: fontSizes["4xl"],
    lineHeight: lineHeights["4xl"],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontSize: fontSizes["3xl"],
    lineHeight: lineHeights["3xl"],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontSize: fontSizes["2xl"],
    lineHeight: lineHeights["2xl"],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },
  h4: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  label: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
  },
  button: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
  },
} as const;
