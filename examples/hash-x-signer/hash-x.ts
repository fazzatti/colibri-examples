/**
 * Example: Authorize a Stellar payment with a Hash-X signer.
 *
 * A Hash-X signer proves knowledge of a secret value called a preimage. The
 * Stellar account stores only the SHA-256 hash of that value as an `X...`
 * signer key. To authorize a transaction, the envelope reveals the original
 * preimage, and Stellar hashes it to verify that it matches the installed key.
 *
 * This single file demonstrates the complete lifecycle:
 *
 * 1. create a disposable account, recipient, and secret preimage;
 * 2. install the preimage's hash as an account signer;
 * 3. authorize a payment using only the preimage;
 * 4. remove the signer after the preimage becomes public; and
 * 5. zeroize Colibri's retained copy of the preimage.
 */
import {
  createClassicTransactionPipeline,
  HashXSigner,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StrKey,
} from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";
import chalk from "chalk";

console.log(chalk.bgBlue("Hash-X signer example on Stellar Testnet"));

/**
 * Hash-X authorizes a classic transaction envelope, so we create Colibri's
 * classic transaction pipeline for Testnet.
 *
 * `NetworkConfig.TestNet()` keeps the network passphrase, RPC URL, and
 * Friendbot URL together. The RPC client is passed explicitly so every step
 * uses the same connection.
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
 * We create three independent pieces of state:
 *
 * - `account` owns the XLM and initially controls itself through its master
 *   Ed25519 key;
 * - `recipient` receives the example payment; and
 * - `hashXSigner` owns a secure random 32-byte preimage.
 *
 * Passing `true` to `generateRandom` prevents application code from reading the
 * preimage directly. The signer can still reveal it when authorizing an
 * envelope, which is the only place this example needs it.
 */
const account = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const hashXSigner = HashXSigner.generateRandom(true);

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Hash-X signer:", chalk.green(hashXSigner.signerKey()));

/**
 * Friendbot creates and funds the two disposable Testnet accounts. The Hash-X
 * signer is not an account and therefore does not need funding.
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
 * Before a Hash-X value can authorize this account, the account owner must add
 * its SHA-256 hash with a `setOptions` operation.
 *
 * Stellar's `setOptions` operation expects the raw 32-byte hash, while Colibri
 * exposes the same identity as an `X...` StrKey. `decodeSha256Hash` converts
 * between those two representations.
 *
 * We set every account threshold to 1 and give the new signer weight 1. The
 * master key keeps its existing weight, so either the master key or the Hash-X
 * preimage can satisfy the payment's medium threshold. Keeping the master key
 * active also gives us a safe way to remove the disclosed signer later.
 */
console.log(chalk.bold("\n1. Installing the Hash-X signer on the account..."));
const installHash = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      lowThreshold: 1,
      medThreshold: 1,
      highThreshold: 1,
      signer: {
        sha256Hash: StrKey.decodeSha256Hash(hashXSigner.signerKey()),
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
  "Installed the hash in transaction:",
  chalk.green(installHash.hash),
);

/**
 * A Colibri envelope signer declares which account it can satisfy.
 *
 * Adding this target lets the envelope-signing process match the source
 * account's signature requirement with `hashXSigner`. It also prevents a signer
 * from being used accidentally for an unrelated account.
 */
hashXSigner.addTarget(account.publicKey());

/**
 * We now build and submit a normal 1 XLM payment, but the transaction config
 * contains only `hashXSigner`. The account's master key is intentionally absent.
 *
 * The classic transaction pipeline:
 *
 * 1. loads the source account and builds the transaction;
 * 2. determines the envelope's signing requirements;
 * 3. matches the account requirement with the targeted Hash-X signer;
 * 4. adds the preimage to the envelope; and
 * 5. submits and confirms the transaction.
 *
 * Unlike Ed25519 signing, the envelope contains the preimage itself rather than
 * a signature over the transaction hash.
 */
console.log(
  chalk.bold("\n2. Paying 1 XLM using only the Hash-X preimage..."),
);
const payment = await classicPipeline.run({
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
  ],
  config: {
    source: account.publicKey(),
    fee: baseFee,
    timeout,
    signers: [hashXSigner],
  },
});

console.log(
  "Payment authorized only by the revealed preimage:",
  chalk.green(payment.hash),
);

/**
 * The submitted envelope is public ledger data, so the preimage is no longer a
 * secret. Leaving the same `X...` signer installed would let anyone who reads
 * that envelope reuse the disclosed value.
 *
 * We therefore use the still-private master key to submit another `setOptions`
 * operation with weight 0, which removes the Hash-X signer from the account.
 */
console.log(chalk.bold("\n3. Removing the disclosed signer..."));
const removeHash = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      signer: {
        sha256Hash: StrKey.decodeSha256Hash(hashXSigner.signerKey()),
        weight: 0,
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
  "Removed the disclosed Hash-X signer:",
  chalk.green(removeHash.hash),
);

/**
 * Finally, `destroy` overwrites and invalidates the preimage retained inside
 * this signer instance on a best-effort basis. This protects against accidental
 * reuse inside the running application; it cannot erase the value already
 * published in the transaction envelope.
 */
hashXSigner.destroy();
console.log(
  chalk.yellow(
    "The retained preimage was zeroized. Never reuse a disclosed preimage.",
  ),
);
