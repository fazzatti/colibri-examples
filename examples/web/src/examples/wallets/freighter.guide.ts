import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Connect to the upstream Freighter API directly, without the Wallets Kit picker.",
  "steps": [
    "Install Freighter, select Testnet, and click Connect directly to Freighter. The example checks extension availability before requesting access.",
    "Approve access in the extension. useConnection displays the direct freighter connector and account.",
    "Disconnect to release Colibri authority. Compare Signing capabilities with the Wallets Kit path: this direct adapter exposes envelope signing.",
  ],
  "outcome":
    "An unavailable extension produces installation guidance. A wrong network produces Testnet guidance. A successful request displays the freighter connector.",
  "docs": [
    {
      "label": "Freighter and general connectors",
      "path": "colibri-react/wallets-and-sessions",
    },
  ],
} satisfies LessonGuide;
