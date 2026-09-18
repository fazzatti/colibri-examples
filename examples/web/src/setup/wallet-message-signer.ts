import type { MessageSigner } from "@colibri/core/signers";
import { StrKey } from "@colibri/core/strkey";
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import type { WalletsKitAccount } from "@colibri/react/ecosystem/stellar-wallets-kit";

// Use the installed Kit's own types. The application opts in only for its
// Freighter module, whose message API supports SEP-53 and returns base64.
export function createWalletMessageSigner(
  kit: Pick<
    typeof StellarWalletsKit,
    "selectedModule" | "getAddress" | "getNetwork" | "signMessage"
  >,
  account: WalletsKitAccount,
): MessageSigner {
  const { address, networkPassphrase, module } = account;
  if (!StrKey.isEd25519PublicKey(address)) {
    throw new Error("Message signing needs a G-address.");
  }

  async function checkIdentity() {
    const current = await kit.getAddress();
    const network = await kit.getNetwork();
    if (
      current.address !== address ||
      network.networkPassphrase !== networkPassphrase ||
      kit.selectedModule !== module
    ) {
      throw new Error(
        "The wallet account, network or module changed. Reconnect before signing.",
      );
    }
  }

  return {
    publicKey: () => address,
    async signMessage(message) {
      // This lesson signs UTF-8 text. Reject invalid UTF-8 byte input instead
      // of replacing bytes and asking the wallet to sign a different message.
      const text = typeof message === "string"
        ? message
        : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
          message,
        );
      await checkIdentity();
      const result = await kit.signMessage(text, {
        address,
        networkPassphrase,
      });
      await checkIdentity();
      if (result.signerAddress && result.signerAddress !== address) {
        throw new Error(
          "The wallet returned a signature from another account.",
        );
      }
      const signature = Uint8Array.from(
        atob(result.signedMessage),
        (byte) => byte.charCodeAt(0),
      );

      // Check the exact bytes with SEP-53 before returning them to the hook.
      // Older wallets using another message-signing scheme must not appear to
      // succeed here; they can still be used in transaction examples.
      const { Keypair } = await import("@stellar/stellar-sdk");
      if (
        signature.length !== 64 ||
        !Keypair.fromPublicKey(address).verifyMessage(message, signature)
      ) {
        throw new Error(
          "The wallet did not return a valid SEP-53 signature. Update Freighter or use a local signer.",
        );
      }
      return signature;
    },
  };
}
