import type { LocalSigner } from "@colibri/core";
import { createWalletConnector } from "@colibri/react/wallets";
import { network } from "./network.ts";

let signer: LocalSigner | undefined;

// SEP-10 currently needs a full Core keypair signer. This explicit practice
// connector creates a disposable identity for that lesson, never a wallet key.
// Nothing is saved to browser storage; disconnect destroys the signing handle.
export const practiceConnector = createWalletConnector({
  id: "practice-identity",
  async connect() {
    signer?.destroy();
    const { LocalSigner } = await import("@colibri/core");
    signer = LocalSigner.generateRandom(true);
    return {
      address: signer.publicKey(),
      networkPassphrase: network.networkPassphrase,
      signers: [signer],
      messageSigner: signer,
    };
  },
  disconnect() {
    signer?.destroy();
    signer = undefined;
    return Promise.resolve();
  },
});

export function getPracticeSigner() {
  if (!signer) {
    throw new Error("Create a practice identity in this lesson first.");
  }
  return signer;
}
