import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Invoke increment with explicit signing authority and invalidate the affected read after success.",
  "steps": [
    "Prepare the counter fixture and connect a funded Testnet wallet. The displayed fee payer is the transaction source.",
    "Click Invoke increment (+1). The example supplies method arguments, source, signers, fee and timeout to useContractInvoke.",
    "Approve the wallet request. On success, invalidate the exact getCount query key so the stored count is read again.",
  ],
  "outcome":
    "The count increases by one and a transaction result becomes available. Soroban fees are paid; the fixture contract rejects values above 100.",
  "docs": [
    {
      "label": "Invocation and cache refresh",
      "path": "colibri-react/contracts-and-transactions",
    },
    {
      "label": "Query invalidation",
      "path": "colibri-react/queries",
    },
  ],
} satisfies LessonGuide;
