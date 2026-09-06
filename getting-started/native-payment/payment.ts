/**
 * Send one native XLM payment through a callable Colibri pipeline.
 * Run: deno task payment
 *
 * We keep the operation as a Stellar SDK object. Colibri obtains the sequence,
 * builds the envelope, selects the signer, submits through RPC and waits for
 * confirmation. No Soroban contract or simulation is involved.
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";

/**
 * The sender pays 1 XLM; the recipient receives it.
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

const sendPayment = createClassicTransactionPipeline({ networkConfig });

// Native payment amounts are decimal asset units. "1" means one XLM.
const result = await sendPayment({
  operations: [Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  })],
  config: senderConfig,
});

console.log("Confirmed payment:", result.hash);
console.log("Ledger:", result.ledger);
console.log("Actual fee charged (stroops):", result.feeCharged);

// The operations are native SDK values, so results narrow by a runtime tag,
// rather than by a special Colibri operation builder or a TypeScript cast.
const outcome = result.operations[0];

if (outcome.type !== "payment") throw new Error("Expected a payment outcome.");

console.log("Operation result:", outcome.result.type);
