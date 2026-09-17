import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: [{
      find: /^@colibri\/core(?=\/|$)/,
      replacement: "@jsr/colibri__core",
    }, {
      find: /^@colibri\/webauth(?=\/|$)/,
      replacement: "@jsr/colibri__webauth",
    }],
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@colibri/core",
      "@jsr/colibri__core",
    ],
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
