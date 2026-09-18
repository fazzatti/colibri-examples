/**
 * Inspect transaction-signing capabilities for a selected local key or wallet.
 *
 * Choose a source in SignerProvider, then follow useSigners to see the guarded
 * signers exposed by that connection. The display projects them into capability
 * booleans instead of serializing signing handles. No signature is requested.
 * Compare local and wallet results to learn why an address alone cannot tell an
 * application which signing operations are available. SEP-53 message signing is
 * a separate connection capability, demonstrated in message.tsx.
 *
 * @module
 */
import { SignerProvider } from "../../setup/signer-provider.tsx";
import { useSigners } from "@colibri/react/signers";
import { Data, Note, Value } from "../../components/lesson.tsx";

function Capabilities() {
  // The hook guards supported signing methods against connection changes.
  // An empty array while disconnected is expected, not a fabricated signer.
  const signers = useSigners();

  // Project only the methods this lesson compares. Transaction envelopes,
  // Soroban authorization entries and preauthorization are distinct roles;
  // never pass the signing handles themselves to the diagnostic renderer.
  const capabilities = signers.map((signer) => ({
    envelope: "signTransaction" in signer,
    authorizationEntry: "signSorobanAuthEntry" in signer,
    preauthorizedTransaction: "authorizesTransaction" in signer,
  }));
  return (
    <>
      <Note>
        Choose a local signer or the connected wallet above. The capability list
        changes because the integrations explicitly expose different supported
        methods.
      </Note>
      <Value label="Configured signers">{signers.length}</Value>
      <Data value={capabilities} label="Signing capabilities" />
      <p>
        Only capability names are displayed here. Signer objects and private
        keys never belong in diagnostics or browser persistence.
      </p>
      <a href="#wallet">Open wallet connection →</a>
    </>
  );
}

// The lesson observes whichever source the reader chooses here. Its nested
// provider isolates local practice keys from the header's external wallet.
export default function Signers() {
  return (
    <SignerProvider>
      <Capabilities />
    </SignerProvider>
  );
}
