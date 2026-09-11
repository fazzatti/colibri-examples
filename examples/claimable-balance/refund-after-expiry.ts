/**
 * Example: Refund After Expiry
 *
 * Create a claimable balance, let the recipient window close, then reclaim
 * it as the sender. Ledger close time determines eligibility; expiration
 * does not move funds automatically.
 *
 * Run: deno task refund
 */
import {
  ClaimableBalancePredicates,
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAsset,
  type TransactionConfig,
} from "@colibri/core";
import { Claimant, Operation } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";

/**
 * The sender will create and later reclaim this balance; the recipient
 * deliberately makes no claim. Fund fresh Testnet accounts so this example
 * has its own state and does not depend on the claim lesson.
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
 * Use an explicit absolute deadline for this short demonstration. The
 * ledger's close time is the authority; a wall-clock wait alone does not
 * prove expiry.
 */
const deadline = Math.floor(Date.now() / 1000) + 30;
const beforeDeadline = ClaimableBalancePredicates.beforeAbsoluteTime(deadline);
const asset = StellarAsset.NativeXLM({ networkConfig });

const created = await asset.createClaimableBalance({
  amount: "1",
  claimants: [
    new Claimant(recipient.publicKey(), beforeDeadline),
    new Claimant(
      sender.publicKey(),
      ClaimableBalancePredicates.not(beforeDeadline),
    ),
  ],
  config: senderConfig,
});

/**
 * Read the balance ID from the confirmed create operation, not from the
 * transaction hash. A later claim refers to this specific ledger entry.
 */
const outcome = created.operations[0];

if (
  outcome.type !== "createClaimableBalance" ||
  outcome.result.type !== "createClaimableBalanceSuccess"
) {
  throw new Error("Expected a created claimable balance");
}

const balanceId = outcome.result.balanceId.toXdr("hex");

console.log(
  "Created balance; waiting for ledger time to pass",
  new Date(deadline * 1000),
);

/**
 * Poll only to observe ledger time, not to repeatedly submit failing claims.
 * The overall timeout keeps an unavailable network from hanging the example.
 */
const rpc = new Server(networkConfig.rpcUrl);
const stopWaitingAt = Date.now() + 120_000;

while (true) {
  const latest = await rpc.getLatestLedger();

  const response = await rpc.getLedgers({
    startLedger: latest.sequence,
    pagination: { limit: 1 },
  });

  // An empty RPC page is not evidence that the deadline has passed.
  const closedLedger = response.ledgers[0];
  const refundIsAvailable = closedLedger !== undefined &&
    Number(closedLedger.ledgerCloseTime) >= deadline;

  if (refundIsAvailable) break;

  if (Date.now() > stopWaitingAt) {
    throw new Error("Ledger did not reach the refund deadline");
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

/**
 * Nobody claimed the balance in this independent example. The sender must
 * now submit a claim too: expiration makes a refund possible, not automatic.
 */
const refundBalance = createClassicTransactionPipeline({ networkConfig });

const refunded = await refundBalance({
  operations: [Operation.claimClaimableBalance({ balanceId })],
  config: senderConfig,
});

console.log("Sender reclaimed after expiry:", refunded.hash);
