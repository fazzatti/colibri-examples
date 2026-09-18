import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Invoke increment with explicit signing authority and invalidate the affected read after success.",
  "steps": [
    "Open this page directly after preparing the counter fixture (deno task setup in examples/web). Click Create and fund signer; Friendbot creates this lesson’s account, and setup waits for RPC visibility before enabling invocation.",
    "Click Invoke increment (+1). The example supplies method arguments, source, signers, fee and timeout to useContractInvoke.",
    "The lesson’s local signer signs without a wallet prompt. On success, invalidate the exact getCount query key so the stored count is read again. Leaving this page destroys the local key without affecting the connected wallet.",
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
