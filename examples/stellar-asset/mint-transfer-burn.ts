/**
 * Manage an issued asset with native Stellar operations, not contract calls.
 * Run: deno task lifecycle
 *
 * An asset is identified by BOTH code and issuer. Mint/burn here are ordinary
 * issuer/holder payments. They never create trustlines or change authorization
 * as hidden side effects.
 */
import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAsset,
  type TransactionConfig,
} from "@colibri/core";
import { Asset } from "stellar-sdk";

/**
 * The issuer controls DEMO supply; Alice and Bob hold the asset.
 * These disposable identities use Testnet only. Never substitute production
 * secrets into a tutorial. Friendbot creates and funds each account, and the
 * RPC option waits until that funding is visible before the next step.
 */
const networkConfig = NetworkConfig.TestNet();
using issuer = LocalSigner.generateRandom();
using alice = LocalSigner.generateRandom();
using bob = LocalSigner.generateRandom();
for (const signer of [issuer, alice, bob]) {
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
const issuerConfig: TransactionConfig = {
  source: issuer.publicKey(),
  signers: [issuer],
  fee: "100",
  timeout: 60,
};
const aliceConfig: TransactionConfig = {
  source: alice.publicKey(),
  signers: [alice],
  fee: "100",
  timeout: 60,
};
const bobConfig: TransactionConfig = {
  source: bob.publicKey(),
  signers: [bob],
  fee: "100",
  timeout: 60,
};

const credits = new StellarAsset({
  asset: new Asset("DEMO", issuer.publicKey()),
  networkConfig,
});

/**
 * Each holder opts in with a trustline and sets a maximum balance. The issuer
 * does not need a trustline to its own asset. A code alone is not an identity:
 * another issuer could create a completely unrelated asset also called DEMO.
 */
await credits.changeTrust({ limit: "1000", config: aliceConfig });
await credits.changeTrust({ limit: "1000", config: bobConfig });

// A payment from the issuer mints units into Alice's balance.
await credits.mint({
  destination: alice.publicKey(),
  amount: "100",
  config: issuerConfig,
});

// The class already knows the asset, so each action states only its own inputs.
await credits.transfer({
  destination: bob.publicKey(),
  amount: "25",
  config: aliceConfig,
});

// A payment back to the issuer burns units. Bob's trustline still exists.
await credits.burn({ amount: "5", config: bobConfig });

/**
 * Writes use decimal strings. Reads return integer smallest units (seven
 * decimals for native Stellar assets). Use the asset's formatter to display
 * them without floating-point arithmetic. Total balance is not necessarily
 * spendable balance: reserves, liabilities and authorization still matter.
 */
console.log("Asset:", credits.toString());
console.log(
  "Alice:",
  credits.formatAmount(await credits.balance({ id: alice.publicKey() })),
);
console.log(
  "Bob:",
  credits.formatAmount(await credits.balance({ id: bob.publicKey() })),
);
console.log("Expected balances: Alice 75 DEMO; Bob 20 DEMO.");
