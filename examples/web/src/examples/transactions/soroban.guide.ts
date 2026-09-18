import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Submit a native Soroban operation through Colibri’s complete transaction pipeline.",
  "steps": [
    "Prepare the counter fixture with deno task setup in examples/web. Choose a local signer or the connected wallet, then check/fund that source on this page.",
    "Click Submit Soroban increment (+1). The native operation encodes increment with a u32 argument; the pipeline gets current account state.",
    "A local signer signs in memory; a wallet asks for approval. Inspect the returned hash and read the counter again.",
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
