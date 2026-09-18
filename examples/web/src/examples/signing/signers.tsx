import { SignerProvider } from "../../setup/signer-provider.tsx";
import { useSigners } from "@colibri/react/signers";
import { Data, Note, Value } from "../../components/lesson.tsx";

function Capabilities() {
  // The hook guards supported signing methods against connection changes.
  // An empty array while disconnected is expected, not a fabricated signer.
  const signers = useSigners();
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

export default function Signers() {
  return (
    <SignerProvider>
      <Capabilities />
    </SignerProvider>
  );
}
