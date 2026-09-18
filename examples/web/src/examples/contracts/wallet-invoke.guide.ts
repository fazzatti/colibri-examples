import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Invoke the counter using connection-derived source and signers while keeping transaction settings explicit.",
  "steps": [
    "Prepare the counter fixture (deno task setup in examples/web). Connect a Testnet wallet using the header on this page. The account check must succeed before invoking; Fund with Friendbot creates an unfunded wallet account.",
    "Click Invoke with connected wallet (+1). useWalletContractInvoke derives source and guarded signers from the active connection.",
    "Approve the signature. The success callback refetches getCount to display the new value.",
  ],
  "outcome":
    "The count increases by one. Fees and timeout still come from this example; mounting the component never opens a signing prompt.",
  "docs": [
    {
      "label": "Wallet-bound invocation",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
