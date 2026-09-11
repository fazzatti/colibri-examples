/**
 * Respect a recipient's SEP-29 memo requirement without replacing native Memo.
 * Run: deno task payment
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { createSep29Plugin } from "@colibri/plugin-sep29";
import { Asset, Memo, Operation } from "stellar-sdk";

/**
 * The recipient represents a service that identifies customers using memos.
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

/**
 * Each configuration states who pays the ordinary fee and signs that
 * account. A string fee is the per-operation bid in stroops, not the actual
 * fee charged.
 */
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

/**
 * The RECIPIENT opts into the SEP-29 convention through account data.
 * This is a real manageData operation and incurs a subentry reserve.
 */
await configureRecipient({
  operations: [
    Operation.manageData({ name: "config.memo_required", value: "1" }),
  ],
  config: recipientConfig,
});

const sendPayment = createClassicTransactionPipeline({ networkConfig });

/**
 * Attach the memo-presence check before sending the payment. The plugin
 * reads the destination's declared account-data policy and rejects a missing
 * memo before transaction submission.
 */
sendPayment.use(createSep29Plugin());

/**
 * The recipient supplies this customer ID out of band. SEP-29 does not discover
 * or verify the correct memo value. It only guards presence before submission.
 * Any non-none memo satisfies that presence check; this example chooses an ID.
 */
const result = await sendPayment({
  operations: [Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  })],
  config: { ...senderConfig, memo: Memo.id("12345") },
});

console.log("Confirmed memo-bearing payment:", result.hash);
