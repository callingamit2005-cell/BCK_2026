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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0a0014", // Deep Void
        foreground: "hsl(var(--foreground))",
        "deep-void": "#0a0014",
        "dynamic-pink": "#ff0f7b",
        "neon-purple": "#5f0a87",
        "silver-mist": "#b3b3b3",
        primary: {
          DEFAULT: "#ff0f7b",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#5f0a87",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgba(179, 179, 179, 0.1)",
          foreground: "#b3b3b3",
        },
        accent: {
          DEFAULT: "rgba(255, 15, 123, 0.1)",
          foreground: "#ff0f7b",
        },
        popover: {
          DEFAULT: "#0a0014",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      transitionTimingFunction: {
        "butter-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      dropShadow: {
        "neon-bloom": [
          "0 0 10px rgba(255, 15, 123, 0.8)",
          "0 0 20px rgba(95, 10, 135, 0.6)"
        ],
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
        "soft-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(255, 15, 123, 0), 0 0 18px rgba(255, 15, 123, 0.18)",
          },
          "50%": {
            transform: "scale(1.05)",
            boxShadow: "0 0 0 rgba(255, 15, 123, 0), 0 0 28px rgba(255, 15, 123, 0.32)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translate3d(0, 12px, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
        "neon-flash": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
            filter: "drop-shadow(0 0 8px rgba(255, 15, 123, 0.28))",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            filter: "drop-shadow(0 0 16px rgba(255, 15, 123, 0.45))",
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
        "soft-pulse": "soft-pulse 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out both",
        "neon-flash": "neon-flash 3.2s ease-in-out infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
