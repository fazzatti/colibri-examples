import { useSigners } from "@colibri/react/signers";
import { Data, Note, Value } from "../../components/lesson.tsx";

export default function Signers() {
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
        Connect through Wallets Kit, then compare the direct Freighter path. The
        capability list changes because the integrations explicitly expose
        different supported methods.
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
