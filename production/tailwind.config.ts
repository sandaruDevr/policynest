import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter-tight)", "var(--font-inter)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Brand surface system (dark navy from sample, evolved)
        canvas: {
          DEFAULT: "#070f17",
          raised: "#0b1620",
          inset: "#050b12",
        },
        surface: {
          DEFAULT: "rgba(255,255,255,0.04)",
          strong: "rgba(255,255,255,0.07)",
          subtle: "rgba(255,255,255,0.025)",
        },
        hairline: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.12)",
          subtle: "rgba(255,255,255,0.04)",
        },
        // Brand primary — refined purple/indigo with deeper, more enterprise tone
        brand: {
          50: "#f3f1ff",
          100: "#e7e3ff",
          200: "#cfc6ff",
          300: "#b0a3ff",
          400: "#8d78ff",
          500: "#6c54f5",
          600: "#5a3fe0",
          700: "#4a30c2",
          800: "#3a259a",
          900: "#251866",
        },
        // Trust accent — calm clinical teal
        accent: {
          50: "#eafaf6",
          100: "#cdf2e6",
          200: "#9ee5cf",
          300: "#5fd0b0",
          400: "#2eb990",
          500: "#1a9c79",
          600: "#117d61",
          700: "#0d614c",
          800: "#0a4a3a",
          900: "#063127",
        },
        // Severity scales
        critical: {
          50: "#fef2f2",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        warn: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        info: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        // Semantic neutrals on dark
        ink: {
          DEFAULT: "#f5f7fa",
          muted: "#a4adba",
          dim: "#7a8493",
          faint: "#5a6473",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        elev1: "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        elev2:
          "0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        elev3:
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -20px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(108,84,245,0.35), 0 12px 40px -12px rgba(108,84,245,0.5)",
        "glow-accent":
          "0 0 0 1px rgba(46,185,144,0.3), 0 12px 40px -12px rgba(46,185,144,0.45)",
        "glow-critical":
          "0 0 0 1px rgba(239,68,68,0.35), 0 12px 40px -12px rgba(239,68,68,0.5)",
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-brand":
          "radial-gradient(80% 60% at 50% 0%, rgba(108,84,245,0.18) 0%, rgba(108,84,245,0) 60%)",
        "radial-accent":
          "radial-gradient(80% 60% at 50% 0%, rgba(46,185,144,0.14) 0%, rgba(46,185,144,0) 60%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        "fade-in": "fade-in 280ms cubic-bezier(.22,1,.36,1)",
        "scale-in": "scale-in 200ms cubic-bezier(.22,1,.36,1)",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
