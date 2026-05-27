import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(0, 0, 0, 0.06)",
        input: "rgba(0, 0, 0, 0.06)",
        ring: "#111111",
        background: "#FAFAFA", // Premium Light Foundation
        foreground: "#111111", // Primary Text
        surface: "#FFFFFF", // Card Background
        "surface-elevated": "#F5F5F5",
        "text-secondary": "#666666",
        "text-muted": "#999999",
        "ai-accent": "#111111", // Monochrome AI Accent
        success: "#111111", // Premium Monochrome Success
        warning: "#666666", // Premium Monochrome Warning
        expense: "#111111", // Premium Monochrome Expense
        // Premium Fintech Semantic Palette
        fintech: {
          emerald: {
            DEFAULT: "#10b981",
            muted: "#ecfdf5",
            dark: "#065f46",
          },
          amber: {
            DEFAULT: "#f59e0b",
            muted: "#fffbeb",
            dark: "#92400e",
          },
          sapphire: {
            DEFAULT: "#3b82f6",
            muted: "#eff6ff",
            dark: "#1e40af",
          },
          rose: {
            DEFAULT: "#f43f5e",
            muted: "#fff1f2",
            dark: "#9f1239",
          },
          graphite: {
            DEFAULT: "#1a1a1a",
            muted: "#737373",
          }
        },
        primary: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          foreground: "#111111",
        },
        destructive: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "rgba(0, 0, 0, 0.03)",
          foreground: "#111111",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      transitionTimingFunction: {
        "butter-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      willChange: {
        auto: "auto",
        transform: "transform",
        opacity: "opacity",
        "transform-opacity": "transform, opacity",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translate3d(0, 8px, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
