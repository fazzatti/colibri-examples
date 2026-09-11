/**
 * Example: Buy Offer Lifecycle
 *
 * Place a limit order to buy MARKET with XLM, inspect its confirmed effect,
 * update the amount and cancel the remaining offer. Prices describe the
 * maximum XLM spent per MARKET.
 *
 * Run: deno task buy
 */
import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  SDEX,
  StellarAsset,
  type TransactionConfig,
} from "@colibri/core";
import { Asset } from "stellar-sdk";

/**
 * The issuer creates an isolated MARKET asset and the trader buys it. The
 * trader needs a trustline to receive that asset when an offer fills.
 * Friendbot funds their Testnet accounts and waits for RPC visibility.
 */
const networkConfig = NetworkConfig.TestNet();
using issuer = LocalSigner.generateRandom();
using trader = LocalSigner.generateRandom();

for (const signer of [issuer, trader]) {
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
const issuerConfig: TransactionConfig = {
  source: issuer.publicKey(),
  signers: [issuer],
  fee: { base: "100" },
  timeout: 120,
};
const traderConfig: TransactionConfig = {
  source: trader.publicKey(),
  signers: [trader],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * The trustline lets the trader RECEIVE this issued asset when an offer
 * fills. Its identity is code + issuer, not just the human-readable code.
 */
const demo = new Asset("MARKET", issuer.publicKey());
const xlm = Asset.native();
const asset = new StellarAsset({ asset: demo, networkConfig });

// The trader opts into holding this asset before the issuer sends any units.
await asset.changeTrust({ limit: "1000", config: traderConfig });

// Fund the trader with this lesson's issued asset, separately from the offer.
await asset.mint({
  destination: trader.publicKey(),
  amount: "100",
  config: issuerConfig,
});

/**
 * This fresh asset has no counter-orders. We will submit a limit offer and
 * inspect its confirmed outcome, rather than assume submission created one.
 */
const market = new SDEX({ networkConfig });

/**
 * "Buy 5 MARKET and spend at most 2 XLM per MARKET" describes the purchased
 * asset, not the native manageBuyOffer selling/buying price orientation.
 */
const placed = await market.buy({
  asset: demo,
  amount: "5",
  payWith: xlm,
  maximumSpendPerUnit: "2",
  config: traderConfig,
});

/**
 * First identify the operation result. TypeScript then exposes its native
 * Stellar SDK success fields without a cast.
 */
const outcome = placed.operations[0];

if (
  outcome.type !== "manageBuyOffer" ||
  outcome.result.type !== "manageBuyOfferSuccess"
) {
  throw new Error("Expected a successful manageBuyOffer operation");
}

/**
 * A successful operation may create, update, or delete an offer. The effect
 * describes which happened; only created/updated effects contain an offer
 * entry.
 */
const offerEffect = outcome.result.success.offer;

if (offerEffect.type !== "manageOfferCreated") {
  throw new Error("Expected a newly created resting offer");
}

// The entry holds the actual ledger data. Keep its ID for later updates.
const createdOffer = offerEffect.offer;
const offerId = createdOffer.offerId.toString();

console.log("Created buy offer:", offerId);

/**
 * Update this same offer: 3 MARKET is the new outstanding buy amount, not 3
 * additional units. The new limit is 1.5 XLM per MARKET.
 */
await market.updateBuy({
  asset: demo,
  amount: "3",
  payWith: xlm,
  maximumSpendPerUnit: "1.5",
  offerId,
  config: traderConfig,
});

// Cancel the remaining offer by its confirmed ID and release its liabilities.
await market.cancelOffer({
  seller: trader.publicKey(),
  offerId,
  config: traderConfig,
});

console.log("Buy offer cancelled. No market-price discovery was performed.");
