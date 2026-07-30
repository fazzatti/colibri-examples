/**
 * Example: Install and execute one exact pre-authorized transaction.
 *
 * A pre-authorized transaction signer stores a future transaction hash as a
 * Stellar `T...` account signer. When that exact transaction is submitted,
 * Stellar grants the configured signer weight without requiring a decorated
 * envelope signature.
 *
 * This example demonstrates the complete lifecycle:
 *
 * 1. finalize a future payment before it can be submitted;
 * 2. derive and install its `T...` signer in an earlier setup transaction;
 * 3. verify and submit the exact prepared payment with no signatures; and
 * 4. confirm that Stellar automatically removed the consumed signer.
 */
import {
  LocalSigner,
  PreAuthorizedTransactionSigner,
  StrKey,
} from "@colibri/core";
import { Asset, Horizon, Operation } from "stellar-sdk";
import chalk from "chalk";
import {
  authorizeAndSubmit,
  buildAfterSetup,
  fund,
  installAccountSigner,
  networkConfig,
} from "./shared.ts";

console.log(
  chalk.bgBlue("Pre-authorized transaction example on Stellar Testnet"),
);

/**
 * `account` owns the XLM and authorizes the setup transaction with its master
 * key. `recipient` receives the future payment.
 *
 * No third private key is needed: the future transaction itself is the
 * authorization identity.
 */
const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();

/**
 * Friendbot creates and funds both disposable Testnet accounts.
 */
await fund(account, recipient);

/**
 * The setup transaction will consume the source account's next sequence number.
 * If RPC reports the current sequence as `N`, we therefore finalize the payment
 * at `N + 2`, immediately after the setup transaction at `N + 1`.
 *
 * This payment must already contain its final fee, time bounds, operation,
 * destination, amount, and network passphrase. Changing any hash-affecting
 * field later would create a different transaction and invalidate the signer.
 */
console.log(chalk.bold("\n1. Preparing the exact future payment..."));
const futurePayment = await buildAfterSetup(account.publicKey(), [
  Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  }),
]);

/**
 * `fromTransaction` hashes those finalized transaction bytes and exposes the
 * hash as a Stellar `T...` signer key.
 *
 * A `T...` key is a human-readable encoding of a 32-byte transaction hash. It
 * contains no private key and never produces a decorated signature.
 */
const preAuthorized = PreAuthorizedTransactionSigner.fromTransaction(
  futurePayment,
);

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log(
  "Pre-authorized transaction key:",
  chalk.green(preAuthorized.signerKey()),
);

/**
 * The account owner submits the setup transaction at sequence `N + 1`.
 *
 * `setOptions` expects the raw transaction hash, so `decodePreAuthTx` converts
 * Colibri's `T...` identity into the 32-byte SDK representation. We give it
 * weight 1 and set all account thresholds to 1.
 *
 * The master key keeps its existing weight, but it will intentionally be absent
 * when we submit the future payment.
 */
console.log(
  chalk.bold("\n2. Installing the future transaction hash as a signer..."),
);
const installPreAuthorization = await installAccountSigner(
  account,
  Operation.setOptions({
    lowThreshold: 1,
    medThreshold: 1,
    highThreshold: 1,
    signer: {
      preAuthTx: StrKey.decodePreAuthTx(preAuthorized.signerKey()),
      weight: 1,
    },
  }),
);
console.log(
  "Installed the exact transaction hash:",
  chalk.green(installPreAuthorization),
);

/**
 * Colibri signers declare which account requirements they may satisfy. This
 * associates the `T...` signer with the source account whose signer list now
 * contains that exact transaction hash.
 */
preAuthorized.addTarget(account.publicKey());

/**
 * `authorizeAndSubmit` asks Colibri to satisfy the prepared envelope's signing
 * requirements with only `preAuthorized`.
 *
 * `PreAuthorizedTransactionSigner` verifies that the current transaction hash
 * matches its stored hash. It then authorizes the requirement without adding a
 * decorated signature because Stellar recognizes the installed hash directly.
 */
console.log(
  chalk.bold(
    "\n3. Verifying and submitting the pre-authorized transaction...",
  ),
);
const submitted = await authorizeAndSubmit(
  futurePayment,
  [preAuthorized],
);

console.log(
  "Decorated signatures added:",
  chalk.green(submitted.transaction.signatures.length),
);
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
 * and the account owner would need to remove it explicitly.
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
