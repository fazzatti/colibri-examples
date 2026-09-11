/**
 * Example: Per-operation Base Fee
 *
 * Send two native payments in one transaction. A base bid of 100 stroops per
 * operation produces a 200-stroop envelope bid, which we compare with the
 * actual ledger charge.
 *
 * Run: deno task base
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
 * Fund a sender and recipient on Testnet before sending the two payments.
 * Both operations share one transaction source and sequence, so they use one
 * envelope and one transaction validity window.
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
 * Both operations are in ONE transaction. 100 stroops per operation means a
 * 200-stroop envelope bid. Read feeCharged separately: it reports the actual
 * ledger charge, which should equal this minimum bid on an uncongested run.
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
  config: { ...senderConfig, fee: { base: "100" } },
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
