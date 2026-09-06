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
  AuthRequiredFlag,
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

// Authorization-required is an ACCOUNT policy. Set it before creating trustlines.
// Revocable lets the issuer change an existing holder's authorization later.
const configureIssuer = createClassicTransactionPipeline({ networkConfig });
await configureIssuer({
  operations: [
    Operation.setOptions({ setFlags: AuthRequiredFlag | AuthRevocableFlag }),
  ],
  config: issuerConfig,
});
const asset = new StellarAsset({
  asset: new Asset("PERMIT", issuer.publicKey()),
  networkConfig,
});
await asset.changeTrust({ limit: "1000", config: holderConfig });
console.log(
  "Initially authorized:",
  await asset.authorized({ id: holder.publicKey() }),
);

// Creating a trustline expresses willingness to hold the asset. It does NOT
// grant issuer permission. The issuer must authorize this trustline explicitly.
await asset.setAuthorized({
  id: holder.publicKey(),
  authorize: true,
  config: issuerConfig,
});
await asset.mint({
  destination: holder.publicKey(),
  amount: "10",
  config: issuerConfig,
});
console.log(
  "Balance:",
  asset.formatAmount(await asset.balance({ id: holder.publicKey() })),
);

// This convenience revokes transfer authorization while allowing maintenance
// of existing liabilities. It is NOT the same as clearing every trustline flag.
await asset.setAuthorized({
  id: holder.publicKey(),
  authorize: false,
  config: issuerConfig,
});
console.log(
  "Authorized after revocation:",
  await asset.authorized({ id: holder.publicKey() }),
);
