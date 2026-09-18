import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Keep a generated Counter client stable across React renders and inspect the ABI it contains.",
  "steps": [
    "Run deno task install to generate the typed client offline, and deno task setup to deploy the Testnet fixture. Restart the app after setup if needed.",
    "Read the configured contract ID and ABI function names from the retained client.",
    "Click Rerender component. useContract returns the same instance while the network and contract ID dependencies remain unchanged.",
  ],
  "outcome":
    "The local update count increases while Same client after rerender stays true. This lesson constructs a client; it does not invoke a contract.",
  "docs": [
    {
      "label": "Generated contract bindings",
      "path": "colibri-contract-bindings/contract-bindings",
    },
    {
      "label": "Contract workflows",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
