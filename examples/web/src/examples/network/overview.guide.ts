import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read the provider’s Testnet configuration and request the latest ledger from Stellar RPC. This shows how configuration accessors differ from a data-fetching hook.",
  "steps": [
    "Compare the RPC endpoint and network passphrase with your provider configuration. No wallet is required for these public reads.",
    "The page makes one request on entry. Refresh ledger requests another result; the spinner and status indicate an in-flight request.",
    "Optionally enable Auto-refresh every 5 seconds. The countdown shows the next request; disable it or leave the page to stop polling.",
  ],
  "outcome":
    "The latest ledger number and response update after a successful read. Refreshing may return the same ledger if the network has not closed another one.",
  "docs": [
    {
      "label": "Provider setup",
      "path": "colibri-react/setup",
    },
    {
      "label": "Query controls and caching",
      "path": "colibri-react/queries",
    },
  ],
} satisfies LessonGuide;
