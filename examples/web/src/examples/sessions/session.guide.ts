import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Authenticate a disposable identity through a real local SEP-10 exchange, then observe session cleanup.",
  "steps": [
    "Run deno task auth from examples/web. This page discovers its own client; Refresh discovery retries if the server was unavailable.",
    "Create a local signer. The current Colibri SEP-10 client requires synchronous raw-key signing, which Kit/direct Freighter do not provide. The wallet choice is disabled with that explanation for these connectors.",
    "Click Authenticate with SEP-10. The client validates and signs the challenge; the server verifies it and returns a short-lived token.",
    "Inspect the session and expiry. Log out clears authentication; disconnect, replacement or leaving destroys the local identity/session. The header wallet is retained.",
  ],
  "outcome":
    "The session becomes authenticated without a ledger transaction. Its token stays in memory and is cleared on expiry, logout, identity change or leaving this lesson.",
  "docs": [
    {
      "label": "WebAuth and session lifecycle",
      "path": "colibri-react/wallets-and-sessions",
    },
  ],
} satisfies LessonGuide;
