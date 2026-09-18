import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Inspect which signing methods the active connection exposes without requesting a signature.",
  "steps": [
    "Connect through Wallets Kit, then return here. The hook returns guarded signer objects from that connection.",
    "Expand Signing capabilities to inspect envelope and authorization-entry support. Only capability names are displayed.",
    "Connect through Direct Freighter and return to compare its envelope-only configuration. Disconnecting leaves an empty signer list.",
  ],
  "outcome":
    "The displayed count and capabilities follow the chosen adapter. Knowing an account address alone does not provide signing authority.",
  "docs": [
    {
      "label": "Wallet signing capabilities",
      "path": "colibri-react/wallets-and-sessions",
    },
  ],
} satisfies LessonGuide;
