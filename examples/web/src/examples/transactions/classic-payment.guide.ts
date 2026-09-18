import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Submit a Classic payment of exactly 1 Testnet XLM using a native Stellar operation.",
  "steps": [
    "Choose a local signer or the connected wallet. Check or fund the selected source on this page.",
    "Enter an existing recipient, use the public fixture, or generate and fund a practice recipient here. Confirm both G-addresses; both accounts must exist before sending.",
    "Click Send 1 Testnet XLM. useClassicTransaction receives the operation, selected source/signers, fee and timeout. Only the wallet path asks for wallet approval.",
    "Inspect the result and follow the hash. Switching signer source clears the previous receipt and form.",
  ],
  "outcome":
    "The recipient receives 1 XLM and the source pays the transaction fee. Pending covers the whole pipeline; check the transaction before retrying an ambiguous error.",
  "docs": [
    {
      "label": "Classic pipeline workflow",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
