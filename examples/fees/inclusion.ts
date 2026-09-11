/**
 * Example: Exact Inclusion Bid
 *
 * Send two native payments with one exact total inclusion bid of 205
 * stroops. Inspect the confirmed envelope to distinguish a total bid from a
 * per-operation base fee.
 *
 * Run: deno task inclusion
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { Asset, Operation, TransactionBuilder } from "stellar-sdk";

/**
 * The sender pays and signs for both operations; the recipient receives
 * their combined 3 XLM. Friendbot funds the Testnet accounts before we build
 * the transaction.
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
 * The transaction configuration names its source account and the signers
 * allowed to satisfy its requirements. base is an inclusion bid per
 * operation in stroops. The transaction source pays the ordinary fee.
 * timeout sets transaction validity in seconds, not an RPC request deadline.
 */
const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Both operations are in ONE transaction. 205 stroops is the exact total
 * inclusion bid, not 205 per operation. Confirmed feeCharged can be lower
 * than that bid when there is no congestion.
 */
const sendTwoPayments = createClassicTransactionPipeline({ networkConfig });

const result = await sendTwoPayments({
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "2",
    }),
  ],
  config: { ...senderConfig, fee: { inclusion: "205" } },
});

/**
 * Decode the envelope returned by RPC after confirmation. Its fee is the
 * bid; the transaction result reports what the network actually charged.
 */
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const confirmed = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

console.log("Confirmed envelope fee bid:", confirmed.fee, "stroops");
console.log("Actually charged:", result.feeCharged, "stroops");
console.log("Transaction:", result.hash);
