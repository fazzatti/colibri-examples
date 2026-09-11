/**
 * Example: Claim Before Expiry
 *
 * Create a 1-XLM claimable balance with a recipient deadline and a
 * complementary sender refund rule. The recipient then signs an explicit
 * claim while its predicate is satisfied.
 *
 * Run: deno task claim
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

/**
 * The sender locks 1 XLM and pays for creating the balance. The recipient
 * pays and signs for its claim. Friendbot creates both Testnet accounts so
 * either can submit the required transaction.
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
const recipientConfig: TransactionConfig = {
  source: recipient.publicKey(),
  signers: [recipient],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Relative predicates use the ledger close time at creation, not this
 * computer's clock. Before 10 minutes the recipient can claim; afterward the
 * sender can. The two complementary predicates avoid leaving the balance
 * permanently stuck.
 */
const beforeDeadline = ClaimableBalancePredicates.beforeRelativeTime(600);
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

console.log("Created balance:", balanceId);

/**
 * The claimant signs an explicit claim operation. A claimable balance is not
 * an automatic scheduled payment, and its ID comes from the confirmed
 * result.
 */
const claimBalance = createClassicTransactionPipeline({ networkConfig });

const claimed = await claimBalance({
  operations: [Operation.claimClaimableBalance({ balanceId })],
  config: recipientConfig,
});

console.log("Recipient claimed before expiry:", claimed.hash);
