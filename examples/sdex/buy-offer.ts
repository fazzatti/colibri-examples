import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  SDEX,
  StellarAsset,
  type TransactionConfig,
} from "@colibri/core";
import { Asset } from "stellar-sdk";
// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
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

// The trustline lets the trader RECEIVE this issued asset when an offer fills.
// Its identity is code + issuer, not just the human-readable code.
const demo = new Asset("MARKET", issuer.publicKey());
const xlm = Asset.native();
const asset = new StellarAsset({ asset: demo, networkConfig });
await asset.changeTrust({ limit: "1000", config: traderConfig });
await asset.mint({
  destination: trader.publicKey(),
  amount: "100",
  config: issuerConfig,
});
const market = new SDEX({ networkConfig });
// This fresh asset has no counter-orders. The example expects a resting offer,
// but checks the protocol's result rather than equating submission with creation.

// "Buy 5 MARKET and spend at most 2 XLM per MARKET" describes the purchased
// asset, not the native manageBuyOffer selling/buying price orientation.
const placed = await market.buy({
  asset: demo,
  amount: "5",
  payWith: xlm,
  maximumSpendPerUnit: "2",
  config: traderConfig,
});
const outcome = placed.operations[0];
if (
  outcome.type !== "manageBuyOffer" ||
  outcome.result.type !== "manageBuyOfferSuccess" ||
  outcome.result.success.offer.type !== "manageOfferCreated"
) {
  throw new Error("Expected a new resting buy offer for this fresh asset");
}
const offerId = outcome.result.success.offer.offer.offerId.toString();
console.log("Created buy offer:", offerId);
await market.updateBuy({
  asset: demo,
  amount: "3",
  payWith: xlm,
  maximumSpendPerUnit: "1.5",
  offerId,
  config: traderConfig,
});
await market.cancelOffer({
  seller: trader.publicKey(),
  offerId,
  config: traderConfig,
});
console.log("Buy offer cancelled. No market-price discovery was performed.");
