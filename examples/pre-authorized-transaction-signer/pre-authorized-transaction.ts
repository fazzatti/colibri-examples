/**
 * Installs and executes one exact pre-authorized Testnet payment.
 *
 * The `T...` signer adds no decorated signature. Stellar recognizes the exact
 * transaction hash and removes the signer automatically after application.
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

const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();

await fund(account, recipient);

const futurePayment = await buildAfterSetup(account.publicKey(), [
  Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  }),
]);
const preAuthorized = PreAuthorizedTransactionSigner.fromTransaction(
  futurePayment,
);

console.log("Account:", chalk.green(account.publicKey()));
console.log(
  "Pre-authorized transaction key:",
  chalk.green(preAuthorized.signerKey()),
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

preAuthorized.addTarget(account.publicKey());
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
