import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `npm run dev` runs this on :5173 and proxies /api to the Express server on :3000.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:3000" } },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("three") || id.includes("@react-three")) return "three";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
        },
      },
    },
  },
});
