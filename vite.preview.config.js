// TEMPORARY - local sandbox preview only. Not part of the project; do not commit.
// Mirrors vite.config.js but allows the e2b preview host.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: process.env.VERCEL ? "vercel" : "node-server",
  },
  vite: {
    optimizeDeps: {
      exclude: ["framer-motion", "@radix-ui/react-progress"],
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      cors: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
  },
});
