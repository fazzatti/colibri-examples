import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Authenticate a disposable identity through a real local SEP-10 exchange, then observe session cleanup.",
  "steps": [
    "Start deno task auth. This page discovers the local client automatically; Refresh discovery retries if the server was unavailable.",
    "Create a practice identity. The current SEP-10 API requires the complete keypair signer used by this connector.",
    "Click Authenticate with SEP-10. The client validates and signs the challenge; the server verifies it and returns a short-lived token.",
    "Inspect the session and expiry. Log out locally clears authentication; Disconnect identity also releases signing authority.",
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
