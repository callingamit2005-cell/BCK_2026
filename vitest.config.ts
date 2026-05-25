import { defineConfig } from "vite"; // changed from vitest/config for cleaner prod build
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // 1. BASE PATH: Yeh sabse zaroori hai MIME type error fix karne ke liye
  base: "/", 
  
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 2. BUILD OPTIMIZATION: Production ke liye files ko sahi se pack karna
  build: {
    outDir: "dist",
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Assets ko alag folder mein saaf-suthra rakhne ke liye
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },

  // 3. TESTING: Jo aapka pehle se tha, usko niche shift kar diya
  // @ts-ignore - Vitest types fix
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
