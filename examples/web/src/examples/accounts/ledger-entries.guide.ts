import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Compose a lower-level ledger entry read when a dedicated query hook does not cover the entry you need.",
  "steps": [
    "Enter a funded Testnet G-address. The read starts automatically once the address is valid.",
    "useLedgerEntries supplies the account() reader. colibriQueryOptions wraps its call with a network-scoped key for TanStack useQuery.",
    "Expand Returned data to inspect the account entry. Other reader helpers address other kinds of known ledger keys.",
  ],
  "outcome":
    "The query reports loading, data or an error, while the Colibri hook supplies the reusable reader rather than query state itself.",
  "docs": [
    {
      "label": "Custom queries and keys",
      "path": "colibri-react/queries",
    },
  ],
} satisfies LessonGuide;
