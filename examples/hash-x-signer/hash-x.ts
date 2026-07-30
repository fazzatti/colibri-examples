/**
 * Authorizes a Testnet payment by revealing a Hash-X preimage.
 *
 * The account owner installs the hash first, the payment is signed only by
 * the preimage, and the owner removes the disclosed signer afterwards.
 */
import { HashXSigner, LocalSigner, StrKey } from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import chalk from "chalk";
import {
  classicPipeline,
  configFor,
  fund,
  installAccountSigner,
} from "./shared.ts";

console.log(chalk.bgBlue("Hash-X signer example on Stellar Testnet"));

const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const hashXSigner = HashXSigner.generateRandom(true);

await fund(account, recipient);

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Hash-X signer:", chalk.green(hashXSigner.signerKey()));

const installHash = await installAccountSigner(
  account,
  Operation.setOptions({
    lowThreshold: 1,
    medThreshold: 1,
    highThreshold: 1,
    signer: {
      sha256Hash: StrKey.decodeSha256Hash(hashXSigner.signerKey()),
      weight: 1,
    },
  }),
);
console.log("Installed the hash in transaction:", chalk.green(installHash));

hashXSigner.addTarget(account.publicKey());

const payment = await classicPipeline.run({
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
  ],
  config: configFor(account.publicKey(), [hashXSigner]),
});

console.log(
  "Payment authorized only by the revealed preimage:",
  chalk.green(payment.hash),
);

const removeHash = await installAccountSigner(
  account,
  Operation.setOptions({
    signer: {
      sha256Hash: StrKey.decodeSha256Hash(hashXSigner.signerKey()),
      weight: 0,
    },
  }),
);
console.log(
  "Removed the disclosed Hash-X signer:",
  chalk.green(removeHash),
);

hashXSigner.destroy();
console.log(
  chalk.yellow(
    "The retained preimage was zeroized. Never reuse a disclosed preimage.",
  ),
);
