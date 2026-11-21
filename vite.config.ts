import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `npm run dev` runs this on :5173 and proxies /api to the Express server on :3000.
// Chunking: React/Framer in "vendor" (needed on first paint); three.js and charts load only when a page needs them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:3000" } },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: "vendor", test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|framer-motion|motion-dom|motion-utils)[\\/]/, priority: 30 },
            { name: "three", test: /node_modules[\\/](three|@react-three|three-stdlib|troika-[a-z-]+|maath|meshline|camera-controls|zustand|suspend-react|its-fine|react-use-measure)[\\/]/, priority: 20 },
            { name: "charts", test: /node_modules[\\/](recharts|d3-[a-z]+|victory-vendor|es-toolkit|immer|reselect|@reduxjs|redux|react-redux|decimal\.js-light|eventemitter3)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
