import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Authenticate a disposable identity through a real local SEP-10 exchange, then observe session cleanup.",
  "steps": [
    "Dev and preview start the local auth fixture automatically. This page discovers its own client; Refresh discovery retries after a service failure or restart.",
    "Create a local signer, or connect a Testnet wallet in the header and choose Use connected wallet. Wallets Kit/Freighter and direct Freighter can sign the SEP-10 challenge asynchronously.",
    "Click Authenticate with SEP-10 and approve the wallet request if prompted. Activity records challenge retrieval, the wait for signing, signed-envelope exchange and the authenticated session. Colibri validates before signing; the server verifies the exchange and returns a short-lived token. No challenge XDR, signatures or tokens enter Activity.",
    "Inspect the session and expiry. Log out clears authentication; disconnect, replacement or leaving clears the session. A local key is destroyed on exit; disconnecting a selected wallet disconnects the header too.",
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
