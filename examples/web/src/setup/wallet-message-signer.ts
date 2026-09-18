/**
 * Adapt the configured Kit/Freighter SEP-53 message capability to Colibri.
 *
 * createWalletMessageSigner captures one connected G-address, network and Kit
 * module. Each request verifies that identity before and after wallet approval,
 * converts the upstream base64 signature to bytes, and verifies those bytes
 * against the requested message. Only verified bytes reach useSignMessage.
 * The adapter uses installed Kit types and accepts text or valid UTF-8 bytes;
 * it does not generalize Freighter's signing format to unrelated modules.
 *
 * @module
 */
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

  // Wallet approval is asynchronous: the user can change accounts or
  // networks while a prompt is open. Check the live Kit state at both ends
  // of the request before accepting a signature for the captured identity.
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

      // The upstream result is base64 text; Colibri's MessageSigner returns
      // bytes. Invalid base64 rejects here, and length/SEP-53 checks below reject
      // well-encoded but incompatible signatures.
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
