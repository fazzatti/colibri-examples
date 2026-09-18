import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read native XLM as an explicit asset kind and convert integer stroops to a readable amount.",
  "steps": [
    "Enter a funded Testnet G-address. A valid address starts the public balance query automatically.",
    "Compare the XLM value with Raw stroops. One XLM is 10,000,000 stroops; formatting uses integer arithmetic.",
    "Expand Returned data to inspect the raw bigint value and decimals used for display.",
  ],
  "outcome":
    "The result is the ledger balance. It does not subtract minimum reserves or liabilities to estimate spendable XLM.",
  "docs": [],
} satisfies LessonGuide;
