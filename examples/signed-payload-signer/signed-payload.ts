/**
 * Example: Bind a signed-payload signer to one prepared Stellar transaction.
 *
 * Stellar's `P...` signer key combines an Ed25519 public key with an arbitrary
 * payload of 1 to 64 bytes. The corresponding envelope signature signs that
 * payload directly, not the transaction hash.
 *
 * To give the payload a useful one-transaction meaning, this example:
 *
 * 1. finalizes a future payment;
 * 2. uses that payment's 32-byte transaction hash as the payload;
 * 3. installs the resulting `P...` key on the source account;
 * 4. verifies the transaction still matches the payload before signing;
 * 5. signs the payload and submits the prepared payment; and
 * 6. removes the persistent signer after its signature is disclosed.
 */
import { Ed25519SignedPayloadSigner, LocalSigner } from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import { Buffer } from "buffer";
import chalk from "chalk";
import {
  authorizeAndSubmit,
  buildAfterSetup,
  fund,
  installAccountSigner,
} from "./shared.ts";

console.log(
  chalk.bgBlue("Transaction-bound signed-payload example on Stellar Testnet"),
);

/**
 * The example uses three Ed25519 keypairs for different roles:
 *
 * - `account` owns the XLM and submits both account-management transactions;
 * - `recipient` receives the payment; and
 * - `payloadKey` signs the fixed payload embedded in the `P...` signer.
 *
 * `payloadKey` is not used as a Stellar account here, so it does not need to be
 * created or funded on the network.
 */
const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const payloadKey = LocalSigner.generateRandom();

/**
 * Friendbot creates the source and recipient accounts on Testnet. The source
 * account starts with its normal master key as its only signer.
 */
await fund(account, recipient);

/**
 * Sequence numbers make this a two-transaction setup.
 *
 * If the account currently has sequence `N`, the setup transaction that
 * installs the signer will consume `N + 1`. We therefore prepare the payment at
 * `N + 2`, which is the next valid sequence after setup.
 *
 * The complete future payment must be finalized now because any later change to
 * its operations, sequence, fee, time bounds, memo, or network changes its
 * transaction hash and therefore changes the intended payload.
 */
console.log(chalk.bold("\n1. Preparing the future payment..."));
const futurePayment = await buildAfterSetup(account.publicKey(), [
  Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  }),
]);

/**
 * `forTransaction` hashes the finalized payment and embeds that 32-byte value
 * together with `payloadKey`'s public key in a Stellar `P...` signer key.
 *
 * The private key remains inside `payloadKey`. The `P...` value is public and
 * is what we install on the account.
 */
const payloadSigner = Ed25519SignedPayloadSigner.forTransaction({
  signer: payloadKey,
  transaction: futurePayment,
});
const payload = payloadSigner.payload();
const payloadBytes = ArrayBuffer.isView(payload)
  ? new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
  : new Uint8Array(payload);

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Payload signer public key:", chalk.green(payloadKey.publicKey()));
console.log("Signed-payload key:", chalk.green(payloadSigner.signerKey()));
console.log(
  "Payload (future transaction hash):",
  chalk.green(Buffer.from(payloadBytes).toString("hex")),
);

/**
 * The account owner now submits the setup transaction at sequence `N + 1`.
 *
 * We install the `P...` signer with weight 1 and set every threshold to 1.
 * The account's master key keeps its existing weight, so it remains available
 * for cleanup. The future payment will intentionally omit that master key and
 * satisfy the medium threshold through the payload signer alone.
 */
console.log(
  chalk.bold("\n2. Installing the signed-payload signer on the account..."),
);
const installPayload = await installAccountSigner(
  account,
  Operation.setOptions({
    lowThreshold: 1,
    medThreshold: 1,
    highThreshold: 1,
    signer: {
      ed25519SignedPayload: payloadSigner.signerKey(),
      weight: 1,
    },
  }),
);
console.log(
  "Installed the transaction-bound signer:",
  chalk.green(installPayload),
);

/**
 * Colibri signers explicitly declare the accounts they may authorize. This
 * target lets `signEnvelope` match the source account requirement with the
 * signed-payload capability.
 */
payloadSigner.addTarget(account.publicKey());

/**
 * This comparison is the application's transaction-binding policy.
 *
 * Stellar verifies that the envelope contains a valid Ed25519 signature over
 * the payload stored in the `P...` key. Stellar does not independently assert
 * that the payload equals the hash of the transaction carrying that signature.
 * We perform that comparison immediately before releasing the signature.
 */
if (!Buffer.from(futurePayment.hash()).equals(Buffer.from(payloadBytes))) {
  throw new Error("The prepared transaction no longer matches the payload");
}

/**
 * The transaction is already finalized, so we do not rebuild it through the
 * classic pipeline. `authorizeAndSubmit` derives the envelope requirements,
 * asks `payloadSigner` to add its protocol-specific decorated signature, and
 * submits those exact transaction bytes.
 */
console.log(
  chalk.bold("\n3. Signing the payload and submitting the prepared payment..."),
);
const submitted = await authorizeAndSubmit(
  futurePayment,
  [payloadSigner],
);

console.log(
  "Prepared payment authorized by its payload signature:",
  chalk.green(submitted.hash),
);
console.log("Confirmed in ledger:", chalk.green(submitted.ledger));

/**
 * A signed-payload signature is reusable anywhere the same `P...` key is
 * accepted because it always signs the same payload. The account owner removes
 * the signer with a final master-key-authorized `setOptions` transaction.
 */
console.log(chalk.bold("\n4. Removing the disclosed payload signer..."));
const removePayload = await installAccountSigner(
  account,
  Operation.setOptions({
    signer: {
      ed25519SignedPayload: payloadSigner.signerKey(),
      weight: 0,
    },
  }),
);
console.log(
  "Removed the signed-payload signer:",
  chalk.green(removePayload),
);
console.log(
  chalk.yellow(
    "Stellar verifies the fixed payload, not this application-level hash check. Remove persistent payload signers immediately after disclosure.",
  ),
);
