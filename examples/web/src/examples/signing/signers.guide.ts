import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Inspect which signing methods the active connection exposes without requesting a signature.",
  "steps": [
    "Choose a local signer or the connected wallet. useSigners reads guarded capabilities from the selected provider.",
    "Expand Signing capabilities to inspect envelope and authorization-entry support. Only capability names are displayed.",
    "Compare the local signer, Wallets Kit with Freighter, and the direct Freighter adapter. The direct adapter intentionally exposes only envelope signing.",
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
