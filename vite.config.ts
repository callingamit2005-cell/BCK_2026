import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * BACHATKARO ENTERPRISE CONFIG V3.1 (FIXED)
 * Ngrok + Razorpay Live Gateway Ready
 */
export default defineConfig(({ mode }) => ({
  server: {
    // 1️⃣ Listen on all local interfaces (Ngrok friendly)
    host: true,
    port: 8081,
    strictPort: true,

    // 2️⃣ ✅ FIX — Allow all external hosts (Ngrok works)
    allowedHosts: true,

    // 3️⃣ HMR adaptive configuration
    hmr: mode === "ngrok" ? {
      clientPort: 443,
      overlay: false,
    } : {
      overlay: false,
    },

    // 4️⃣ CORS enabled
    cors: true,
  },

  build: {
    sourcemap: mode === "development",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["@radix-ui/react-slot", "lucide-react"],
        },
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));