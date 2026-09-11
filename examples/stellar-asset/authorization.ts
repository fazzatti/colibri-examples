/**
 * Example: Issuer Authorization
 *
 * An issuer can require approval before a holder receives its asset. Create
 * a trustline under that policy, authorize it, issue tokens and then revoke
 * transfer permission.
 *
 * Run: deno task authorization
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
  AuthRequiredFlag,
  AuthRevocableFlag,
  Operation,
} from "stellar-sdk";

/**
 * The issuer sets the asset policy and signs authorization changes. The
 * holder signs its own trustline creation. Friendbot funds both Testnet
 * accounts and the RPC option waits until their ledger entries are visible.
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
 * Authorization-required is an ACCOUNT policy. Set it before creating
 * trustlines. Revocable lets the issuer change an existing holder's
 * authorization later.
 */
const configureIssuer = createClassicTransactionPipeline({ networkConfig });

await configureIssuer({
  operations: [
    Operation.setOptions({ setFlags: AuthRequiredFlag | AuthRevocableFlag }),
  ],
  config: issuerConfig,
});

// The holder creates its trustline under the issuer policy set above.
const asset = new StellarAsset({
  asset: new Asset("PERMIT", issuer.publicKey()),
  networkConfig,
});

await asset.changeTrust({ limit: "1000", config: holderConfig });

const initiallyAuthorized = await asset.authorized({ id: holder.publicKey() });

console.log("Initially authorized:", initiallyAuthorized);

/**
 * Creating a trustline expresses willingness to hold the asset. It does NOT
 * grant issuer permission. The issuer must authorize this trustline
 * explicitly.
 */
await asset.setAuthorized({
  id: holder.publicKey(),
  authorize: true,
  config: issuerConfig,
});

/**
 * With the trustline authorized, the issuer can send 10 PERMIT to the
 * holder. This issuance is a native payment from the issuer; the holder does
 * not sign this receipt.
 */
await asset.mint({
  destination: holder.publicKey(),
  amount: "10",
  config: issuerConfig,
});

// RPC returns integer smallest units. Format those units only for display.
const balance = await asset.balance({ id: holder.publicKey() });

const formattedBalance = asset.formatAmount(balance);

console.log("Balance:", formattedBalance);

/**
 * This convenience revokes transfer authorization while allowing maintenance
 * of existing liabilities. It is NOT the same as clearing every trustline
 * flag.
 */
await asset.setAuthorized({
  id: holder.publicKey(),
  authorize: false,
  config: issuerConfig,
});

const authorizedAfterRevocation = await asset.authorized({
  id: holder.publicKey(),
});

console.log("Authorized after revocation:", authorizedAfterRevocation);
