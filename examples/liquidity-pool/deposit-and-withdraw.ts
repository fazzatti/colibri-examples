import {
  initializeWithFriendbot,
  LocalSigner,
  NativeLiquidityPool,
  NetworkConfig,
  StellarAsset,
  toDecimals,
  type TransactionConfig,
} from "@colibri/core";
import { Asset } from "stellar-sdk";
// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using issuer = LocalSigner.generateRandom();
using provider = LocalSigner.generateRandom();
for (const signer of [issuer, provider]) {
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
const providerConfig: TransactionConfig = {
  source: provider.publicKey(),
  signers: [provider],
  fee: { base: "100" },
  timeout: 120,
};

const demo = new Asset("POOL", issuer.publicKey());
const xlm = Asset.native();
const asset = new StellarAsset({ asset: demo, networkConfig });
await asset.changeTrust({ limit: "1000", config: providerConfig });
await asset.mint({
  destination: provider.publicKey(),
  amount: "100",
  config: issuerConfig,
});

// Asset trustlines and the pool-SHARE trustline are different ledger entries.
// Colibri sorts the pair canonically; labelled amounts avoid assuming A/B order.
const pool = new NativeLiquidityPool({ assets: [demo, xlm], networkConfig });
await pool.changeTrust({ config: providerConfig });
await pool.depositByAsset({
  maximumAmounts: [{ asset: demo, amount: "10" }, { asset: xlm, amount: "20" }],
  ...pool.priceBounds({
    baseAsset: demo,
    quoteAsset: xlm,
    minimum: "1.9",
    maximum: "2.1",
  }),
  config: providerConfig,
});

// Read the pool and holder position in one RPC observation. Shares / totalShares
// is an ownership fraction, NOT a promise of future withdrawal amounts.
const position = await pool.getPosition(provider.publicKey());
if (!position.ownership) throw new Error("Expected a funded pool position");
console.log("Observed at ledger:", position.observedAtLedger);
console.log("Ownership:", position.ownership);
const shares = toDecimals(position.ownership.shares, 7);

// This fresh, isolated pool has no other trades. Withdraw our full share amount,
// with explicit minimum outputs slightly below the initial 10/20 deposit.
// Real applications must choose their own limits from fresh market information.
await pool.withdrawByAsset({
  amount: shares,
  minimumAmounts: [{ asset: demo, amount: "9.9" }, {
    asset: xlm,
    amount: "19.9",
  }],
  config: providerConfig,
});
console.log(
  "Remaining shares:",
  (await pool.getPosition(provider.publicKey())).trustline.balance,
);
