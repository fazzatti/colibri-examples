import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Submit a native Soroban operation through Colibri’s complete transaction pipeline.",
  "steps": [
    "Prepare the counter fixture (deno task setup in examples/web). Connect a Testnet wallet using the header and inspect the fee payer. Use Fund with Friendbot here if needed; submission requires a successful account check.",
    "Click Submit Soroban increment (+1). The native operation encodes increment with a u32 argument; the pipeline gets current account state.",
    "Approve signing, then inspect the returned transaction hash and read the counter again.",
  ],
  "outcome":
    "This operation commits a +1 change and pays a Soroban fee. It builds a fresh transaction rather than submitting the simulation lesson’s placeholder envelope.",
  "docs": [
    {
      "label": "Soroban pipeline workflow",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
