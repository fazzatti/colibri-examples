import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Invoke the counter using connection-derived source and signers while keeping transaction settings explicit.",
  "steps": [
    "Choose a local signer or the connected wallet. Both provide a connection to the hook; the header continues to show only the external wallet.",
    "Check or fund the chosen source here. Click Invoke with selected connection (+1): useWalletContractInvoke derives source and guarded signers from the nearest provider.",
    "A local signer signs in memory; approve the request when using a wallet. The success callback reads the new count. Switching signer source clears the old result.",
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
