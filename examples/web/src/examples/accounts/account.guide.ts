import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read a Classic account’s public ledger state and display its XLM balance.",
  "steps": [
    "Run deno task setup for the prefilled public fixture, or enter an existing funded Testnet G-address.",
    "Click Read account to select the address. A configured fixture is read automatically when this page opens.",
    "Inspect XLM balance and expand Returned data for sequence, thresholds and other account fields. Refresh requests a new response for the selected address.",
  ],
  "outcome":
    "A funded account returns ledger data. A syntactically valid but unfunded address can return an account-not-found error; that is not a zero balance.",
  "docs": [
    {
      "label": "Query controls",
      "path": "colibri-react/queries",
    },
  ],
} satisfies LessonGuide;
