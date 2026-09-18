import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Discover authentication configuration and prepare a client before starting a challenge exchange.",
  "steps": [
    "Start the app with deno task dev or deno task preview from examples/web. Both start the local auth fixture automatically; restart an already-running older dev process once.",
    "Click Discover WebAuth client. useWebAuthClient reads the local service’s SEP-1 authentication configuration.",
    "Read Activity to follow the HTTP request and validated discovery result. Inspect the home domain and Testnet passphrase, then continue to Authenticate & log out.",
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
