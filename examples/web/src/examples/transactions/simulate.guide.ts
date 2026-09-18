import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Simulate increment(+1) to inspect Soroban resource and authorization requirements before submitting anything.",
  "steps": [
    "Prepare the counter fixture and enter a valid simulation-source G-address.",
    "Click Simulate increment. The example builds a native transaction with a placeholder sequence that is valid only for simulation.",
    "Expand Returned data to inspect the simulation, then open the read lesson to check the stored count.",
  ],
  "outcome":
    "The stored count is unchanged. No wallet signature or fee payment occurs. A successful simulation does not guarantee a later submission will succeed.",
  "docs": [
    {
      "label": "Simulation and submission",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
