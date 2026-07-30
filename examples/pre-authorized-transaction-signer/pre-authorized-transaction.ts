/**
 * Example: Install and execute one exact pre-authorized transaction.
 *
 * A pre-authorized transaction signer stores a future transaction hash as a
 * Stellar `T...` account signer. When that exact transaction is submitted,
 * Stellar grants the configured signer weight without requiring a decorated
 * envelope signature.
 *
 * This single file demonstrates the complete lifecycle:
 *
 * 1. finalize a future payment before it can be submitted;
 * 2. derive and install its `T...` signer in an earlier setup transaction;
 * 3. verify and submit the exact prepared payment with no signatures; and
 * 4. confirm that Stellar automatically removed the consumed signer.
 */
import {
  buildTransaction,
  createClassicTransactionPipeline,
  envelopeSigningRequirements,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  PreAuthorizedTransactionSigner,
  sendTransaction,
  signEnvelope,
  StrKey,
} from "@colibri/core";
import { Asset, Horizon, Operation, Transaction } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";
import chalk from "chalk";

console.log(
  chalk.bgBlue("Pre-authorized transaction example on Stellar Testnet"),
);

/**
 * The classic pipeline will submit the setup transaction that installs the
 * future transaction hash. We also keep the RPC instance because the example
 * needs to read sequence state and later submit the already-built payment.
 */
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});
const classicPipeline = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

const baseFee = "100" as const;
const timeout = 120;

/**
 * `account` owns the XLM and authorizes the setup transaction with its master
 * key. `recipient` receives the future payment.
 *
 * No third private key is needed: the future transaction itself is the
 * authorization identity.
 */
const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));

/**
 * Friendbot creates and funds both disposable Testnet accounts.
 */
console.log("Funding the source account with Friendbot...");
await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  account.publicKey(),
  {
    rpcUrl: networkConfig.rpcUrl,
    allowHttp: networkConfig.allowHttp,
  },
);

console.log("Funding the recipient with Friendbot...");
await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  recipient.publicKey(),
  {
    rpcUrl: networkConfig.rpcUrl,
    allowHttp: networkConfig.allowHttp,
  },
);

/**
 * The setup transaction will consume the source account's next sequence number.
 * If RPC reports the current sequence as `N`, the setup transaction will use
 * `N + 1`, so the prepared payment must use `N + 2`.
 *
 * `buildTransaction` increments the sequence supplied to it. We therefore read
 * `N` from RPC and pass `N + 1`.
 */
console.log(chalk.bold("\n1. Preparing the exact future payment..."));
const accountState = await rpc.getAccount(account.publicKey());
const sequenceBeforeFuture = (
  BigInt(accountState.sequenceNumber()) + 1n
).toString();

/**
 * This payment is finalized now with its fee, time bounds, operation,
 * destination, amount, sequence, and network passphrase. Changing any
 * hash-affecting field later would produce a different `T...` signer.
 */
const futurePayment = await buildTransaction({
  source: account.publicKey(),
  baseFee,
  networkPassphrase: networkConfig.networkPassphrase,
  sequence: sequenceBeforeFuture,
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
  ],
  preconditions: {
    timeoutSeconds: timeout,
  },
});

/**
 * `fromTransaction` hashes the finalized transaction and exposes that hash as a
 * Stellar `T...` signer key.
 *
 * A pre-authorized signer contains no private key and will not produce a
 * decorated envelope signature.
 */
const preAuthorized = PreAuthorizedTransactionSigner.fromTransaction(
  futurePayment,
);

console.log(
  "Pre-authorized transaction key:",
  chalk.green(preAuthorized.signerKey()),
);

/**
 * The account owner submits the setup transaction at sequence `N + 1`.
 *
 * `setOptions` expects the raw 32-byte transaction hash, so
 * `decodePreAuthTx` converts Colibri's `T...` StrKey into the SDK
 * representation. We give it weight 1 and set every account threshold to 1.
 *
 * The master key keeps its existing weight, but it will intentionally be absent
 * when the future payment is submitted.
 */
console.log(
  chalk.bold("\n2. Installing the future transaction hash as a signer..."),
);
const installPreAuthorization = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      lowThreshold: 1,
      medThreshold: 1,
      highThreshold: 1,
      signer: {
        preAuthTx: StrKey.decodePreAuthTx(preAuthorized.signerKey()),
        weight: 1,
      },
    }),
  ],
  config: {
    source: account.publicKey(),
    fee: baseFee,
    timeout,
    signers: [account],
  },
});
console.log(
  "Installed the exact transaction hash:",
  chalk.green(installPreAuthorization.hash),
);

/**
 * Colibri signers declare which account requirements they may satisfy. This
 * associates the `T...` signer with the source account whose signer list now
 * contains that exact transaction hash.
 */
preAuthorized.addTarget(account.publicKey());

/**
 * The future transaction is already finalized, so we authorize those exact
 * bytes directly.
 *
 * `envelopeSigningRequirements` identifies the source account requirement.
 * `signEnvelope` routes it to `preAuthorized`, which verifies that the current
 * transaction hash matches its stored hash.
 *
 * The signer then authorizes the requirement without adding a decorated
 * signature because Stellar recognizes the installed transaction hash itself.
 */
console.log(
  chalk.bold(
    "\n3. Verifying and submitting the pre-authorized transaction...",
  ),
);
const authorizedPayment = await signEnvelope({
  transaction: futurePayment,
  signatureRequirements: envelopeSigningRequirements({
    transaction: futurePayment,
  }),
  signers: [preAuthorized],
});

// This example prepares a classic transaction, not a fee-bump envelope.
if (!(authorizedPayment instanceof Transaction)) {
  throw new Error("Expected a classic transaction after envelope signing");
}

console.log(
  "Decorated signatures added:",
  chalk.green(authorizedPayment.signatures.length),
);

/**
 * Submit the unchanged transaction through RPC and wait for its final ledger
 * result.
 */
const submitted = await sendTransaction({
  transaction: authorizedPayment,
  rpc,
});

console.log(
  "Pre-authorized payment submitted:",
  chalk.green(submitted.hash),
);
console.log("Confirmed in ledger:", chalk.green(submitted.ledger));

/**
 * A pre-authorized signer is one-shot account state. After the matching
 * transaction is applied, Stellar removes the `T...` signer automatically.
 *
 * We query Horizon after confirmation to make that protocol behavior visible.
 * If the transaction were never submitted, the signer would remain installed
 * until another authorized transaction removed it.
 */
console.log(chalk.bold("\n4. Confirming automatic signer removal..."));
const horizon = new Horizon.Server(networkConfig.horizonUrl);
const appliedAccount = await horizon.loadAccount(account.publicKey());
const stillInstalled = appliedAccount.signers.some((signer) =>
  signer.key === preAuthorized.signerKey()
);

console.log(
  "Signer removed automatically:",
  stillInstalled ? chalk.red("no") : chalk.green("yes"),
);
console.log(
  chalk.yellow(
    "Changing the prepared transaction would make its hash fail to match.",
  ),
);
