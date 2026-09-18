import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read the same counter using its ABI spec and exact method spelling, without constructing a generated client.",
  "steps": [
    "Prepare the Testnet counter fixture. The generated constants supply its embedded ABI spec.",
    "The query calls get_count, the ABI method name. Read from spec repeats the read.",
    "The observer decoder checks that the returned value is a number before displaying it.",
  ],
  "outcome":
    "This returns the same stored count as the client read. The supplied ABI describes encoding; it does not verify the deployed Wasm.",
  "docs": [
    {
      "label": "Contract read variants",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
