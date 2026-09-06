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

// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
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

// Clawback is a separate policy from ordinary mint/burn or authorization.
// Enable the issuer flags BEFORE this holder creates a trustline. Existing
// trustlines do not automatically gain clawback support retroactively.
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

await asset.mint({
  destination: holder.publicKey(),
  amount: "10",
  config: issuerConfig,
});

// The issuer removes 3 units without the holder signing. This is an explicit
// capability, unlike burn(), which returns units with the holder's permission.
await asset.clawback({
  from: holder.publicKey(),
  amount: "3",
  config: issuerConfig,
});

// Read the post-clawback balance and convert smallest units to display text.
const balanceAfterClawback = await asset.balance({ id: holder.publicKey() });

const formattedBalance = asset.formatAmount(balanceAfterClawback);

console.log("Holder balance after clawback:", formattedBalance);
