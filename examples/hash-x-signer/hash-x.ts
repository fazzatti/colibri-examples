/**
 * Require a Hash-X preimage in addition to the sender's ordinary signature.
 * This is a transaction-local condition, not a persistent account signer.
 */
import {
  createClassicTransactionPipeline,
  HashXSigner,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";

/**
 * Fund a sender and recipient with Friendbot. The sender's ordinary
 * signature will bind the payment contents; a separate Hash-X preimage will
 * satisfy an additional condition on this transaction only.
 */
const networkConfig = NetworkConfig.TestNet();
using sender = LocalSigner.generateRandom();
using recipient = LocalSigner.generateRandom();

for (const signer of [sender, recipient]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}

/**
 * The sender remains the payment source and ordinary envelope signer. The
 * base fee is in stroops per operation and timeout is transaction validity
 * in seconds. We add the Hash-X condition at the call site below.
 */
const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Only the hash is public before submission. The preimage is revealed in the
 * envelope, so never reuse it as an independent bearer authorization.
 * 'using' zeroizes the retained copy at scope exit. It cannot erase public
 * data.
 */
using hashXSigner = HashXSigner.generateRandom(true);

console.log("Public Hash-X identity:", hashXSigner.signerKey());

/**
 * extraSigners ADDS a requirement; it does not replace the sender's
 * signature. No setOptions transaction is needed and no signer remains
 * installed afterward.
 */
const sendPayment = createClassicTransactionPipeline({ networkConfig });

const payment = await sendPayment({
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
  ],
  config: {
    ...senderConfig,
    extraSigners: [hashXSigner.signerKey()],
    signers: [sender, hashXSigner],
  },
});

console.log("Confirmed payment:", payment.hash);
console.log("Both the transaction signature and preimage were required.");
