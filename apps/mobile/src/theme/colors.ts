/**
 * Color tokens matching the web app's design system (apps/web/app/app.css).
 * OKLCH colors have been converted to hex for React Native compatibility.
 *
 * Primary palette: orange/amber tones
 * Neutral palette: near-black to white
 */

export const lightColors = {
  background: "#FFFFFF",
  foreground: "#252525", // oklch(0.145 0 0)

  card: "#FFFFFF",
  cardForeground: "#252525",

  popover: "#FFFFFF",
  popoverForeground: "#252525",

  primary: "#D97048", // oklch(0.646 0.222 41.116) — signature orange
  primaryForeground: "#F9F0E5", // oklch(0.98 0.016 73.684)

  secondary: "#F5F5F9", // oklch(0.967 0.001 286.375)
  secondaryForeground: "#343434", // oklch(0.21 0.006 285.885)

  muted: "#F7F7F7", // oklch(0.97 0 0)
  mutedForeground: "#8E8E8E", // oklch(0.556 0 0)

  accent: "#F7F7F7",
  accentForeground: "#343434",

  destructive: "#C44B31", // oklch(0.58 0.22 27)
  destructiveForeground: "#FFFFFF",

  border: "#EAEAEA", // oklch(0.922 0 0)
  input: "#EAEAEA",
  ring: "#B5B5B5", // oklch(0.708 0 0)

  // Orange scale (chart colors)
  chart1: "#E8B95A", // oklch(0.837 0.128 66.29) — amber
  chart2: "#E68A3C", // oklch(0.705 0.213 47.604) — orange
  chart3: "#D97048", // oklch(0.646 0.222 41.116) — darker orange
  chart4: "#C45A35", // oklch(0.553 0.195 38.402)
  chart5: "#A84429", // oklch(0.47 0.157 37.304)

  // Sidebar
  sidebar: "#FAFAFA",
  sidebarForeground: "#252525",
  sidebarPrimary: "#D97048",
  sidebarPrimaryForeground: "#F9F0E5",
  sidebarAccent: "#F7F7F7",
  sidebarAccentForeground: "#343434",
  sidebarBorder: "#EAEAEA",
  sidebarRing: "#B5B5B5",

  // Semantic
  success: "#22C55E",
  successForeground: "#FFFFFF",
  warning: "#F59E0B",
  warningForeground: "#FFFFFF",
  info: "#3B82F6",
  infoForeground: "#FFFFFF",

  // Status badge colors (matching dashboard.tsx)
  statusPlannedBg: "#DBEAFE", // blue-100
  statusPlannedText: "#1E40AF", // blue-800
  statusOngoingBg: "#DCFCE7", // green-100
  statusOngoingText: "#166534", // green-800
  statusCompletedBg: "#F3F4F6", // gray-100
  statusCompletedText: "#1F2937", // gray-800

  // Transparent
  transparent: "transparent",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export const darkColors = {
  background: "#252525", // oklch(0.145 0 0)
  foreground: "#FAFAFA", // oklch(0.985 0 0)

  card: "#343434", // oklch(0.205 0 0)
  cardForeground: "#FAFAFA",

  popover: "#343434",
  popoverForeground: "#FAFAFA",

  primary: "#E68A3C", // oklch(0.705 0.213 47.604) — brighter orange for dark mode
  primaryForeground: "#F9F0E5",

  secondary: "#444444", // oklch(0.274 0.006 286.033)
  secondaryForeground: "#FAFAFA",

  muted: "#444444", // oklch(0.269 0 0)
  mutedForeground: "#B5B5B5", // oklch(0.708 0 0)

  accent: "#5E5E5E", // oklch(0.371 0 0)
  accentForeground: "#FAFAFA",

  destructive: "#D96652", // oklch(0.704 0.191 22.216)
  destructiveForeground: "#FAFAFA",

  border: "rgba(255, 255, 255, 0.10)",
  input: "rgba(255, 255, 255, 0.15)",
  ring: "#8E8E8E", // oklch(0.556 0 0)

  // Orange scale (same in dark mode — they're vivid enough)
  chart1: "#E8B95A",
  chart2: "#E68A3C",
  chart3: "#D97048",
  chart4: "#C45A35",
  chart5: "#A84429",

  // Sidebar
  sidebar: "#343434",
  sidebarForeground: "#FAFAFA",
  sidebarPrimary: "#E68A3C",
  sidebarPrimaryForeground: "#F9F0E5",
  sidebarAccent: "#444444",
  sidebarAccentForeground: "#FAFAFA",
  sidebarBorder: "rgba(255, 255, 255, 0.10)",
  sidebarRing: "#8E8E8E",

  // Semantic
  success: "#22C55E",
  successForeground: "#FFFFFF",
  warning: "#F59E0B",
  warningForeground: "#FFFFFF",
  info: "#3B82F6",
  infoForeground: "#FFFFFF",

  // Status badge colors (dark-mode adjusted)
  statusPlannedBg: "#1E3A5F",
  statusPlannedText: "#93C5FD",
  statusOngoingBg: "#14532D",
  statusOngoingText: "#86EFAC",
  statusCompletedBg: "#374151",
  statusCompletedText: "#D1D5DB",

  // Transparent
  transparent: "transparent",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export type ColorScheme = "light" | "dark";
export type Colors = typeof lightColors;

export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;
