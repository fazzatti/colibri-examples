import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Invoke increment with explicit signing authority and invalidate the affected read after success.",
  "steps": [
    "Choose Create local signer or Use connected wallet. If the counter fixture is missing, run deno task setup from examples/web.",
    "Check the selected transaction source and use Fund with Friendbot here if needed. Submission requires the account to exist through RPC; creating a key alone is not enough.",
    "Click Invoke increment (+1). useContractInvoke receives the selected source/signers and explicit arguments, fees and timeout. A local signer signs in memory; a wallet asks for approval.",
    "On success the exact getCount query is invalidated. Changing signer source clears the previous result, and leaving destroys only lesson-owned keys.",
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
