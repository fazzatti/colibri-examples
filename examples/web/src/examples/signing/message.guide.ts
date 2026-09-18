import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Create a SEP-53 message signature, inspect its hexadecimal bytes, and verify it in a separate step using only public data.",
  "steps": [
    "Choose Create local signer or Use connected wallet. The wallet option needs an explicit SEP-53 capability; this app enables it for Wallets Kit with Freighter.",
    "Enter a message and click Sign message. Local signing happens in memory; the wallet asks for approval. The hook returns 64 signature bytes shown as 128 hexadecimal characters.",
    "Copy the signature if needed. Signing fills the separate verification message, public key and signature fields without running verification.",
    "Click Verify signature. Edit the message to observe a mismatch, or paste another public message/key/signature. Changing signer choice resets the form; neither signing nor verification needs funding.",
  ],
  "outcome":
    "The original message/key/signature combination verifies. Changing the message invalidates it. Verification needs no secret, wallet prompt or network request.",
  "docs": [
    {
      "label": "SEP-53 signing and verification",
      "path": "colibri-core/signer/message-signing",
    },
  ],
} satisfies LessonGuide;
