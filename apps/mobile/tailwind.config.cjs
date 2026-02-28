/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light mode — matches web app (apps/web/app/app.css)
        background: "#FFFFFF",
        foreground: "#252525",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#252525",
        },
        primary: {
          DEFAULT: "#D97048", // oklch(0.646 0.222 41.116)
          foreground: "#F9F0E5", // oklch(0.98 0.016 73.684)
        },
        secondary: {
          DEFAULT: "#F5F5F9", // oklch(0.967 0.001 286.375)
          foreground: "#343434", // oklch(0.21 0.006 285.885)
        },
        muted: {
          DEFAULT: "#F7F7F7", // oklch(0.97 0 0)
          foreground: "#8E8E8E", // oklch(0.556 0 0)
        },
        accent: {
          DEFAULT: "#F7F7F7",
          foreground: "#343434",
        },
        destructive: {
          DEFAULT: "#C44B31", // oklch(0.58 0.22 27)
          foreground: "#FFFFFF",
        },
        border: "#EAEAEA", // oklch(0.922 0 0)
        input: "#EAEAEA",
        ring: "#B5B5B5", // oklch(0.708 0 0)
        // Chart colors (orange scale matching web)
        chart: {
          1: "#E8B95A", // oklch(0.837 0.128 66.29)
          2: "#E68A3C", // oklch(0.705 0.213 47.604)
          3: "#D97048", // oklch(0.646 0.222 41.116)
          4: "#C45A35", // oklch(0.553 0.195 38.402)
          5: "#A84429", // oklch(0.47 0.157 37.304)
        },
      },
      borderRadius: {
        sm: "6px",   // calc(var(--radius) - 4px)
        md: "8px",   // calc(var(--radius) - 2px)
        lg: "10px",  // var(--radius) = 0.625rem
        xl: "14px",  // calc(var(--radius) + 4px)
        "2xl": "18px",
        "3xl": "22px",
        "4xl": "26px",
      },
      fontFamily: {
        mono: ["JetBrainsMono_400Regular", "monospace"],
        "mono-medium": ["JetBrainsMono_500Medium", "monospace"],
        "mono-bold": ["JetBrainsMono_700Bold", "monospace"],
        sans: ["JetBrainsMono_400Regular", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "28px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
        "3xl": ["24px", { lineHeight: "32px" }],
        "4xl": ["30px", { lineHeight: "36px" }],
      },
    },
  },
  plugins: [],
};
