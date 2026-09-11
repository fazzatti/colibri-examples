/**
 * Example: Issuer Clawback
 *
 * Enable clawback before creating a trustline, issue 10 RECALL and let the
 * issuer remove 3. Compare this issuer-controlled action with the voluntary
 * burn in the lifecycle example.
 *
 * Run: deno task clawback
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAsset,
  type TransactionConfig,
} from "@colibri/core";
import {
  Asset,
  AuthClawbackEnabledFlag,
  AuthRevocableFlag,
  Operation,
} from "stellar-sdk";

/**
 * The issuer will claw back units from a holder who does not sign that
 * removal. Both disposable accounts need Testnet XLM for setup; Friendbot
 * funds them before we configure the issuer policy.
 */
const networkConfig = NetworkConfig.TestNet();
using issuer = LocalSigner.generateRandom();
using holder = LocalSigner.generateRandom();

for (const signer of [issuer, holder]) {
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
const holderConfig: TransactionConfig = {
  source: holder.publicKey(),
  signers: [holder],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Clawback is a separate policy from ordinary mint/burn or authorization.
 * Enable the issuer flags BEFORE this holder creates a trustline. Existing
 * trustlines do not automatically gain clawback support retroactively.
 */
const configureIssuer = createClassicTransactionPipeline({ networkConfig });

await configureIssuer({
  operations: [
    Operation.setOptions({
      setFlags: AuthRevocableFlag | AuthClawbackEnabledFlag,
    }),
  ],
  config: issuerConfig,
});

// Create the holder's trustline after enabling the clawback policy.
const asset = new StellarAsset({
  asset: new Asset("RECALL", issuer.publicKey()),
  networkConfig,
});

await asset.changeTrust({ limit: "1000", config: holderConfig });

/**
 * Issue 10 RECALL to the new trustline. The holder opted in after the
 * clawback policy was enabled, so the next issuer action can remove part of
 * this balance.
 */
await asset.mint({
  destination: holder.publicKey(),
  amount: "10",
  config: issuerConfig,
});

/**
 * The issuer removes 3 units without the holder signing. This is an explicit
 * capability, unlike burn(), which returns units with the holder's
 * permission.
 */
await asset.clawback({
  from: holder.publicKey(),
  amount: "3",
  config: issuerConfig,
});

// Read the post-clawback balance and convert smallest units to display text.
const balanceAfterClawback = await asset.balance({ id: holder.publicKey() });

const formattedBalance = asset.formatAmount(balanceAfterClawback);

console.log("Holder balance after clawback:", formattedBalance);
