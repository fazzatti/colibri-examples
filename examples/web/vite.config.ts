import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";

export default defineConfig({
  plugins: [deno(), react()],
  base: "./",
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
