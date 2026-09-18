/**
 * Create a disposable, lesson-owned connector backed by a Core LocalSigner.
 *
 * SignerProvider owns one factory instance per mounted lesson. Creating the
 * factory does not generate a key; connect does, and reconnecting replaces it.
 * The returned connection declares envelope/auth-entry and message capabilities
 * through the LocalSigner. disconnect releases its key, while destroy also
 * prevents future connections. No key is persisted and no account is funded;
 * transaction lessons perform their own Testnet account setup.
 *
 * @module
 */
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

      // Replace the previous local identity rather than retaining multiple keys.
      // A new public key still needs funding before a transaction can use it.
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
    destroy() {
      disposed = true;
      release();
    },
  };
}
