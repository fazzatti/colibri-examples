import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";

import { localWebAuth } from "./auth-server/vite.ts";

export default defineConfig({
  plugins: [deno(), react(), localWebAuth()],
  base: "./",
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
