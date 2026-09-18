import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Authenticate a disposable identity through a real local SEP-10 exchange, then observe session cleanup.",
  "steps": [
    "Dev and preview start the local auth fixture automatically. This page discovers its own client; Refresh discovery retries after a service failure or restart.",
    "Create a local signer. The current Colibri SEP-10 client requires synchronous raw-key signing, which Kit/direct Freighter do not provide. The wallet choice is disabled with that explanation for these connectors.",
    "Click Authenticate with SEP-10. Activity records the GET challenge and POST signed challenge, followed by the authenticated session. Colibri validates before signing; the server verifies the exchange and returns a short-lived token. No challenge XDR, signatures or tokens enter Activity.",
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
