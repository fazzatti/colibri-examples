/**
 * Observe a typed SEP-29 rejection BEFORE a payment is submitted.
 * Run: deno task missing
 *
 * This is a separate expected-failure lesson, not a switch in the success flow.
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { createSep29Plugin, Sep29Errors } from "@colibri/plugin-sep29";
import { Asset, Operation } from "stellar-sdk";

/**
 * The recipient requires a memo; the sender deliberately omits it.
 * These disposable identities use Testnet only. Never substitute production
 * secrets into a tutorial. Friendbot creates and funds each account, and the
 * RPC option waits until that funding is visible before the next step.
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

// Each configuration states who pays the ordinary fee and signs that account.
// A string fee is the per-operation bid in stroops, not the actual fee charged.
const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: "100",
  timeout: 60,
};
const recipientConfig: TransactionConfig = {
  source: recipient.publicKey(),
  signers: [recipient],
  fee: "100",
  timeout: 60,
};

const configureRecipient = createClassicTransactionPipeline({ networkConfig });
await configureRecipient({
  operations: [
    Operation.manageData({ name: "config.memo_required", value: "1" }),
  ],
  config: recipientConfig,
});

const sendPayment = createClassicTransactionPipeline({ networkConfig });
sendPayment.use(createSep29Plugin());

try {
  await sendPayment({
    operations: [Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    })],
    config: senderConfig,
  });
  throw new Error(
    "The example expected the memo guard to reject this payment.",
  );
} catch (error) {
  // Do not mistake an RPC outage or another failure for the expected result.
  if (!(error instanceof Sep29Errors.MEMO_REQUIRED)) throw error;
  console.log("Payment not submitted:", error.code);
  console.log(error.details);
}

/**
 * This safeguard is opt-in client behavior, not consensus enforcement. Omitting
 * the plugin would not make the network enforce the convention. M-address
 * destinations are exempt because their embedded ID already identifies a
 * logical recipient. This file deliberately uses a G-address.
 */
