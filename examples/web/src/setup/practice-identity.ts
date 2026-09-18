import { LocalSigner } from "@colibri/core";
import { createWalletConnector } from "@colibri/react/wallets";
import { network } from "./network.ts";

// Each lesson owns a separate connector and signing handle. Constructing the
// connector does not create a key; only clicking the lesson's setup button does.
export function createPracticeIdentity() {
  let signer: LocalSigner | undefined;
  let disposed = false;
  function release() {
    signer?.destroy();
    signer = undefined;
  }
  const connector = createWalletConnector({
    id: "practice-identity",
    connect() {
      if (disposed) throw new Error("This practice lesson has been closed.");
      release();
      signer = LocalSigner.generateRandom(true);
      return Promise.resolve({
        address: signer.publicKey(),
        networkPassphrase: network.networkPassphrase,
        signers: [signer],
        messageSigner: signer,
      });
    },
    disconnect() {
      release();
      return Promise.resolve();
    },
  });
  return {
    connector,
    getSigner() {
      if (!signer) {
        throw new Error("Create a local signer in this lesson first.");
      }
      return signer;
    },
    destroy() {
      disposed = true;
      release();
    },
  };
}
