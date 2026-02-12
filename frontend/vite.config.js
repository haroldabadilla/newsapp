import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        // keep /api prefix — Express routes start with /api
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase to 1000kb to avoid warnings
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap': ['bootstrap'],
          'axios': ['axios'],
        },
      },
    },
  },
});
