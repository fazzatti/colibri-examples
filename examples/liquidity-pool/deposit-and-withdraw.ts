/**
 * Example: Native Liquidity Pool
 *
 * Create an issued-asset/XLM pool position, inspect the provider share
 * balance and withdraw it. Follow the distinction between asset trustlines,
 * pool shares and asset-labelled price bounds.
 *
 * Run: deno task liquidity
 */
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

/**
 * The issuer creates POOL units and the provider deposits them together with
 * XLM. Friendbot funds both disposable Testnet accounts, including the XLM
 * needed for fees and trustline reserves.
 */
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
const providerConfig: TransactionConfig = {
  source: provider.publicKey(),
  signers: [provider],
  fee: { base: "100" },
  timeout: 120,
};

const demo = new Asset("POOL", issuer.publicKey());
const xlm = Asset.native();
const asset = new StellarAsset({ asset: demo, networkConfig });

// First acquire the issued asset; this trustline holds POOL, not pool shares.
await asset.changeTrust({ limit: "1000", config: providerConfig });

await asset.mint({
  destination: provider.publicKey(),
  amount: "100",
  config: issuerConfig,
});

/**
 * Asset trustlines and the pool-SHARE trustline are different ledger
 * entries. Colibri sorts the pair canonically; labelled amounts avoid
 * assuming A/B order.
 */
const pool = new NativeLiquidityPool({ assets: [demo, xlm], networkConfig });

await pool.changeTrust({ config: providerConfig });

/**
 * State the acceptable XLM-per-POOL range in human terms. Colibri translates
 * that range into the protocol's canonically ordered A/B price bounds.
 */
const priceBounds = pool.priceBounds({
  baseAsset: demo,
  quoteAsset: xlm,
  minimum: "1.9",
  maximum: "2.1",
});

/**
 * Deposit with a maximum of 10 POOL and 20 XLM. The labelled assets keep
 * amounts aligned with the pair even when canonical A/B ordering differs.
 * The price bounds above constrain the acceptable deposit ratio.
 */
await pool.depositByAsset({
  maximumAmounts: [{ asset: demo, amount: "10" }, { asset: xlm, amount: "20" }],
  ...priceBounds,
  config: providerConfig,
});

/**
 * Read the pool and holder position in one RPC observation. Shares /
 * totalShares is an ownership fraction, NOT a promise of future withdrawal
 * amounts.
 */
const position = await pool.getPosition(provider.publicKey());

if (!position.ownership) throw new Error("Expected a funded pool position");

console.log("Observed at ledger:", position.observedAtLedger);
console.log("Ownership:", position.ownership);

const shares = toDecimals(position.ownership.shares, 7);

/**
 * This fresh, isolated pool has no other trades. Withdraw our full share
 * amount, with explicit minimum outputs slightly below the initial 10/20
 * deposit. Real applications must choose their own limits from fresh market
 * information.
 */
await pool.withdrawByAsset({
  amount: shares,
  minimumAmounts: [{ asset: demo, amount: "9.9" }, {
    asset: xlm,
    amount: "19.9",
  }],
  config: providerConfig,
});

// Read again after confirmation to see the remaining pool-share balance.
const remainingPosition = await pool.getPosition(provider.publicKey());

console.log("Remaining shares:", remainingPosition.trustline.balance);
