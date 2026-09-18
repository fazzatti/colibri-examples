import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Submit a native Soroban operation through Colibri’s complete transaction pipeline.",
  "steps": [
    "Prepare the counter fixture and connect a funded Testnet wallet. Inspect the fee payer.",
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
