import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Create a SEP-53 message signature, inspect its hexadecimal bytes, and verify it in a separate step using only public data.",
  "steps": [
    "Create a practice identity. This switches the active connection to an unfunded, disposable key held only in memory.",
    "Enter a message and click Sign message. useSignMessage returns 64 signature bytes; the page shows them as 128 hexadecimal characters.",
    "Copy the signature if needed. Signing fills the separate verification message, public key and signature fields, but does not run verification.",
    "Click Verify signature. Edit the verification message and verify again to see a mismatch; you can also paste another public key and SEP-53 signature.",
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
