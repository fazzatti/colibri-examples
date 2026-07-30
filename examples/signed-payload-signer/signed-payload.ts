/**
 * Binds an Ed25519 signed-payload signer to one prepared Testnet payment.
 *
 * The future transaction is finalized first. Its hash becomes the payload in
 * the `P...` signer installed by the setup transaction.
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

const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const payloadKey = LocalSigner.generateRandom();

await fund(account, recipient);

const futurePayment = await buildAfterSetup(account.publicKey(), [
  Operation.payment({
    destination: recipient.publicKey(),
    asset: Asset.native(),
    amount: "1",
  }),
]);
const payloadSigner = Ed25519SignedPayloadSigner.forTransaction({
  signer: payloadKey,
  transaction: futurePayment,
});
const payload = payloadSigner.payload();
const payloadBytes = ArrayBuffer.isView(payload)
  ? new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
  : new Uint8Array(payload);

console.log("Account:", chalk.green(account.publicKey()));
console.log("Payload signer public key:", chalk.green(payloadKey.publicKey()));
console.log("Signed-payload key:", chalk.green(payloadSigner.signerKey()));
console.log(
  "Payload (future transaction hash):",
  chalk.green(Buffer.from(payloadBytes).toString("hex")),
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

payloadSigner.addTarget(account.publicKey());
if (!Buffer.from(futurePayment.hash()).equals(Buffer.from(payloadBytes))) {
  throw new Error("The prepared transaction no longer matches the payload");
}
const submitted = await authorizeAndSubmit(
  futurePayment,
  [payloadSigner],
);

console.log(
  "Prepared payment authorized by its payload signature:",
  chalk.green(submitted.hash),
);
console.log("Confirmed in ledger:", chalk.green(submitted.ledger));

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
