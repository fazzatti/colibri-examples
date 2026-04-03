/**
 * Getting Started Example: Issue an asset with the Stellar Asset Contract.
 *
 * This script shows the core non-native asset flow:
 * 1. create issuer and holder accounts on TestNet
 * 2. deploy a custom SAC instance for the `COLIBRI` asset
 * 3. add a trustline for the holder with a classic Stellar transaction
 * 4. mint `COLIBRI` to the trusted holder account
 * 5. confirm the balance change through the SAC helper
 *
 * Run with: deno task issue-asset
 */
import {
  createClassicTransactionPipeline,
  fromDecimals,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
  toDecimals,
} from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import chalk from "chalk";

console.log(
  chalk.bgBlue("Starting Getting started -> Issue asset example..."),
);

/**
 * TestNet gives us Friendbot funding and a clean place to deploy the contract.
 */
const networkConfig = NetworkConfig.TestNet();
const classicPipeline = createClassicTransactionPipeline({ networkConfig });

/**
 * We use two accounts:
 * - the issuer deploys the contract and authorizes minting
 * - the holder receives the asset and holds the trustline
 */
const issuer = LocalSigner.generateRandom();
const holder = LocalSigner.generateRandom();

console.log("Issuer Public Key:", chalk.green(issuer.publicKey()));
console.log("Holder Public Key:", chalk.green(holder.publicKey()));

/**
 * Fund both accounts first so they can pay for the deploy, trustline, and mint
 * transactions.
 */
await initializeWithFriendbot(networkConfig.friendbotUrl, issuer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
  allowHttp: networkConfig.allowHttp,
});
await initializeWithFriendbot(networkConfig.friendbotUrl, holder.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
  allowHttp: networkConfig.allowHttp,
});

console.log("Issuer and holder are funded.");

/**
 * Create and deploy the custom asset contract.
 *
 * The code/issuer pair describes the asset identity. Here we call the asset
 * `COLIBRI` and use the issuer account we just funded above.
 */
const COLIBRI = await StellarAssetContract.deploy({
  networkConfig,
  code: "COLIBRI",
  issuer: issuer.publicKey(),
  config: {
    source: issuer.publicKey(),
    fee: "100000",
    signers: [issuer],
    timeout: 30,
  },
});

console.log("COLIBRI SAC contract deployed.");
console.log("Contract ID:", chalk.green(COLIBRI.contractId));

/**
 * The SAC knows the asset precision, so we ask it for the decimals instead of
 * hard-coding a conversion factor in the example.
 */
const assetDecimals = await COLIBRI.decimals();

/**
 * Before minting or receiving the custom asset, the holder needs a trustline.
 *
 * That is still classic Stellar behavior, so we use the classic transaction
 * pipeline for this one step and keep the rest of the flow inside SAC.
 */
await classicPipeline.run({
  operations: [
    Operation.changeTrust({
      asset: new Asset("COLIBRI", issuer.publicKey()),
    }),
  ],
  config: {
    source: holder.publicKey(),
    fee: "100",
    timeout: 30,
    signers: [holder],
  },
});

console.log("Holder trustline added for COLIBRI.");

/**
 * Read the holder balance before minting so the example can show the change.
 */
const holderBalanceBefore = await COLIBRI.balance({
  id: holder.publicKey(),
});
console.log(
  `Holder balance before mint: ${chalk.green(
    toDecimals(holderBalanceBefore, assetDecimals),
  )} COLIBRI`,
);

/**
 * Mint 100 COLIBRI directly to the trusted holder account.
 *
 * The issuer signs the mint because it is the account that controls supply.
 */
const mintResult = await COLIBRI.mint({
  to: holder.publicKey(),
  amount: fromDecimals("100", assetDecimals),
  config: {
    source: issuer.publicKey(),
    fee: "100000",
    signers: [issuer],
    timeout: 30,
  },
});

console.log("Minted 100 COLIBRI to the holder.");
console.log("   Hash:", chalk.green(mintResult.hash));

/**
 * Read the balance again to confirm the mint landed.
 */
const holderBalanceAfter = await COLIBRI.balance({
  id: holder.publicKey(),
});

console.log(
  `Holder balance after mint: ${chalk.green(
    toDecimals(holderBalanceAfter, assetDecimals),
  )} COLIBRI`,
);
console.log("✅ Asset issuance successful!");
