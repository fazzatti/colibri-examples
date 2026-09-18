import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Discover authentication configuration and prepare a client before starting a challenge exchange.",
  "steps": [
    "Start deno task auth in a second terminal under examples/web.",
    "Click Discover WebAuth client. useWebAuthClient reads the local service’s SEP-1 authentication configuration.",
    "Inspect the home domain and Testnet passphrase, then continue to Authenticate & log out.",
  ],
  "outcome":
    "Discovery produces a client, not an authenticated session. The local HTTP and browser fetch options are explicit in this example.",
  "docs": [
    {
      "label": "Authentication discovery and sessions",
      "path": "colibri-react/wallets-and-sessions",
    },
  ],
} satisfies LessonGuide;
