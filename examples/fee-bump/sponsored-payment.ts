/**
 * Keep payment authority separate from the account paying transaction fees.
 * Run: deno task payment
 *
 * This lesson uses one payment and one fee-bump plugin. Channel accounts,
 * concurrency and muxed destinations are deliberately separate examples.
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { createFeeBumpPlugin } from "@colibri/plugin-fee-bump";
import {
  Asset,
  FeeBumpTransaction,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";

/**
 * The sender authorizes the payment; a different sponsor pays its fee.
 * These disposable identities use Testnet only. Never substitute production
 * secrets into a tutorial. Friendbot creates and funds each account, and the
 * RPC option waits until that funding is visible before the next step.
 */
const networkConfig = NetworkConfig.TestNet();
using sender = LocalSigner.generateRandom();
using recipient = LocalSigner.generateRandom();
using sponsor = LocalSigner.generateRandom();

for (const signer of [sender, recipient, sponsor]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}

// Each configuration states who pays the ordinary fee and signs that account.
// A string fee is the per-operation bid in stroops, not the actual fee charged.
const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: "100",
  timeout: 60,
};

const sendPayment = createClassicTransactionPipeline({ networkConfig });

/**
 * Attach to the ORIGINAL callable pipeline. Do not replace sendPayment with
 * the return from .use(). The plugin wraps the signed inner transaction in a
 * fee-bump envelope and signs that outer envelope with the sponsor.
 */
sendPayment.use(createFeeBumpPlugin({
  networkConfig,
  feeBumpConfig: {
    source: sponsor.publicKey(),
    fee: "1000",
    signers: [sponsor],
  },
}));

const result = await sendPayment({
  operations: [Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  })],
  config: senderConfig,
});

/**
 * Inspect the CONFIRMED envelope, not an assumed fee-payer relationship.
 * A fee bump does not authorize the sender's payment, fund account reserves or
 * change the amount received. Those remain separate concerns.
 */
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const envelope = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

if (!(envelope instanceof FeeBumpTransaction)) {
  throw new Error("Expected the confirmed fee-bump envelope.");
}

// The inner transaction identifies the payment source. The outer envelope
// identifies the fee payer; these two accounts have separate signing roles.
const paymentTransaction = envelope.innerTransaction;

console.log("Payment source:", paymentTransaction.source);
console.log("Fee payer:", envelope.feeSource);
console.log("Outer fee bid (stroops):", envelope.fee);
console.log("Actual fee charged (stroops):", result.feeCharged);
console.log("Confirmed transaction:", result.hash);
