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
        border: "rgba(255, 255, 255, 0.06)",
        input: "rgba(255, 255, 255, 0.06)",
        ring: "#FFFFFF",
        background: "#050505", // Premium AMOLED Black
        foreground: "#FFFFFF", // Primary Text
        surface: "#121212", // Surface / Card Background
        "surface-elevated": "#181818",
        "text-secondary": "#B3B3B3",
        "text-muted": "#808080",
        "ai-accent": "#FFFFFF", // Monochrome AI Accent
        success: "#FFFFFF", // Premium Monochrome Success
        warning: "#B3B3B3", // Premium Monochrome Warning
        expense: "#FFFFFF", // Premium Monochrome Expense
        primary: {
          DEFAULT: "#FFFFFF",
          foreground: "#050505",
        },
        secondary: {
          DEFAULT: "#121212",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FFFFFF",
          foreground: "#050505",
        },
        muted: {
          DEFAULT: "#121212",
          foreground: "#B3B3B3",
        },
        accent: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#121212",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#121212",
          foreground: "#FFFFFF",
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
