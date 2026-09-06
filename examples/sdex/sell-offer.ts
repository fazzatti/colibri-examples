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

// An issued asset is identified by code AND issuer. The trader must opt in
// with a trustline before receiving units or holding offers in that asset.
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

// "Receive at least 2 XLM for each 1 MARKET" makes the price direction explicit.
const placed = await market.sell({
  asset: demo,
  amount: "10",
  receive: xlm,
  minimumReceivePerUnit: "2",
  config: traderConfig,
});
const outcome = placed.operations[0];
if (
  outcome.type !== "manageSellOffer" ||
  outcome.result.type !== "manageSellOfferSuccess" ||
  outcome.result.success.offer.type !== "manageOfferCreated"
) {
  throw new Error("Expected a new resting offer for this fresh asset");
}
const offerId = outcome.result.success.offer.offer.offerId.toString();
const storedOffer = await market.getOffer({
  seller: trader.publicKey(),
  offerId,
});
if (!storedOffer) {
  throw new Error("The newly created offer is no longer on the ledger");
}
console.log("Created offer:", offerId);
console.log("Outstanding sell amount (smallest units):", storedOffer.amount);
console.log("Price ratio:", storedOffer.price);

// Update the same offer ID, not an unrelated new offer. The amount is the new
// outstanding amount to sell, not a delta to add to the previous 10 units.
await market.updateSell({
  asset: demo,
  amount: "5",
  receive: xlm,
  minimumReceivePerUnit: "2.5",
  offerId,
  config: traderConfig,
});
const cancelled = await market.cancelOffer({
  seller: trader.publicKey(),
  offerId,
  config: traderConfig,
});
console.log("Cancellation result:", cancelled.operations[0]);
// Cancellation releases the offer's liabilities. These are ledger operations,
// not an order-book service: Colibri does not discover markets through RPC.
