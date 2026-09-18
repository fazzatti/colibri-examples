import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Submit a Classic payment of exactly 1 Testnet XLM using a native Stellar operation.",
  "steps": [
    "Connect a Testnet wallet using the header. Check or fund the source on this page. Enter a recipient G-address, or generate a practice recipient and fund it here. Both accounts must exist before sending; confirm their addresses.",
    "Click Send 1 Testnet XLM. useClassicTransaction receives the payment operation plus source, signers, fee and timeout.",
    "Approve the wallet request, inspect the result, and follow the transaction link to look up its hash.",
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
