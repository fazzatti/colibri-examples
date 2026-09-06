/**
 * Let a sponsor reserve XLM for another account's trustline.
 * Run: deno task trustline
 *
 * Reserve sponsorship is NOT a fee bump. Here the sponsor also happens to be
 * the transaction source and pay its fee, but that is a separate choice.
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LedgerEntries,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
  wrapSponsorship,
} from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";

/**
 * The sponsor issues DEMO; the holder owns the new trustline.
 * These disposable identities use Testnet only. Never substitute production
 * secrets into a tutorial. Friendbot creates and funds each account, and the
 * RPC option waits until that funding is visible before the next step.
 */
const networkConfig = NetworkConfig.TestNet();
using sponsor = LocalSigner.generateRandom();
using holder = LocalSigner.generateRandom();
for (const signer of [sponsor, holder]) {
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
const sponsorConfig: TransactionConfig = {
  source: sponsor.publicKey(),
  signers: [sponsor],
  fee: "100",
  timeout: 60,
};

const asset = new Asset("DEMO", sponsor.publicKey());
const createSponsoredTrustline = createClassicTransactionPipeline({
  networkConfig,
});

/**
 * wrapSponsorship returns ordinary Stellar SDK operations:
 * begin sponsorship -> change trust -> end sponsorship.
 * It does not rewrite the inner operation source; state that owner explicitly.
 * The holder signs its trustline/end operation even though the sponsor pays.
 */
const result = await createSponsoredTrustline({
  operations: wrapSponsorship({
    sponsor: sponsor.publicKey(),
    sponsored: holder.publicKey(),
    operations: [Operation.changeTrust({
      source: holder.publicKey(),
      asset,
      limit: "1000",
    })],
  }),
  config: {
    ...sponsorConfig,
    signers: [sponsor, holder],
  },
});

console.log("Confirmed sponsored trustline:", result.hash);
console.log("Operation count:", result.operations.length); // 3, including the boundaries.

/**
 * The trustline belongs to holder, not sponsor. Query that known ledger key
 * through Colibri's typed RPC reader. Sponsorship reserves XLM; it does not
 * transfer issued DEMO into the holder's balance.
 */
const ledger = new LedgerEntries({ networkConfig });
const trustline = await ledger.trustline({
  accountId: holder.publicKey(),
  asset,
});
console.log("Trustline owner:", trustline.accountId);
console.log("Asset:", trustline.asset);
console.log(
  "Balance / limit (smallest units):",
  trustline.balance,
  trustline.limit,
);
