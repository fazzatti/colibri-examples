/**
 * Give Vite dev/preview the local auth fixture required by the WebAuth lessons.
 *
 * Own and close the server when this Vite process starts it. Reuse a compatible
 * separately running fixture without taking ownership or stopping it. A busy
 * port with an unrelated service produces a startup error, not silent failure.
 * Build/static output contains no server; this plugin runs only in local Vite.
 *
 * @module
 */
import type { Plugin } from "vite";
import { Networks } from "@stellar/stellar-sdk";
import { startAuthServer } from "./server.ts";

async function ensureAuthServer() {
  try {
    return startAuthServer();
  } catch (cause) {
    if (!(cause instanceof Deno.errors.AddrInUse)) throw cause;
  }

  // The port may belong to deno task auth or another Vite instance. Check the
  // fixture identity before reusing it; never kill a process to take the port.
  try {
    const response = await fetch("http://127.0.0.1:8787/health", {
      signal: AbortSignal.timeout(2000),
    });
    const health = await response.json();
    if (
      response.ok && health.fixture === "colibri-web-sep10" &&
      health.version === 1 && health.networkPassphrase === Networks.TESTNET
    ) {
      console.log(
        "Using the existing local Testnet SEP-10 fixture on port 8787.",
      );
      return undefined;
    }
  } catch {
    // Keep the actionable startup message the same for an incompatible service
    // and a port owner that does not speak HTTP or respond within the deadline.
  }
  throw new Error(
    "Port 8787 is occupied by another service or an older auth fixture. Stop that service, then restart deno task dev or deno task preview.",
  );
}

export function localWebAuth(): Plugin {
  return {
    name: "colibri-local-webauth",
    async configureServer(vite) {
      const owned = await ensureAuthServer();
      vite.httpServer?.once("close", () => {
        void owned?.shutdown();
      });
    },
    async configurePreviewServer(vite) {
      const owned = await ensureAuthServer();
      vite.httpServer.once("close", () => {
        void owned?.shutdown();
      });
    },
  };
}
