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
 *
 * Every build, pipeline, signing, and submission call is kept in this file so
 * the complete lifecycle is visible.
 */
import {
  buildTransaction,
  createClassicTransactionPipeline,
  Ed25519SignedPayloadSigner,
  envelopeSigningRequirements,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  sendTransaction,
  signEnvelope,
} from "@colibri/core";
import { Asset, Operation, Transaction } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";
import { Buffer } from "buffer";
import chalk from "chalk";

console.log(
  chalk.bgBlue("Transaction-bound signed-payload example on Stellar Testnet"),
);

/**
 * Select Testnet and create the RPC and classic pipeline instances used by the
 * complete example.
 *
 * The classic pipeline handles the ordinary setup and cleanup transactions.
 * The already-finalized future payment will later use Colibri's lower-level
 * envelope helpers so it is never rebuilt.
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

console.log("Account:", chalk.green(account.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Payload signer public key:", chalk.green(payloadKey.publicKey()));

/**
 * Friendbot creates and funds the source and recipient accounts on Testnet.
 * The source begins with its master key as its only signer.
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
 * Sequence numbers make this a two-transaction setup.
 *
 * If the account currently has sequence `N`, the setup transaction that
 * installs the signer will consume `N + 1`. The future payment must therefore
 * use `N + 2`.
 *
 * `buildTransaction` increments the sequence supplied to it, so we read `N`
 * from RPC and pass `N + 1` to build the payment at `N + 2`.
 */
console.log(chalk.bold("\n1. Preparing the exact future payment..."));
const accountState = await rpc.getAccount(account.publicKey());
const sequenceBeforeFuture = (
  BigInt(accountState.sequenceNumber()) + 1n
).toString();

/**
 * The complete future payment is finalized now. Any later change to its
 * operation, sequence, fee, time bounds, memo, or network changes its hash and
 * therefore changes the payload this example intends to authorize.
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
 * `forTransaction` hashes the finalized payment and embeds that 32-byte value
 * together with `payloadKey`'s public key in a Stellar `P...` signer key.
 *
 * The private key remains inside `payloadKey`. The `P...` value is public and
 * is what the source account stores as a signer.
 */
const payloadSigner = Ed25519SignedPayloadSigner.forTransaction({
  signer: payloadKey,
  transaction: futurePayment,
});

const payload = payloadSigner.payload();
const payloadBytes = ArrayBuffer.isView(payload)
  ? new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
  : new Uint8Array(payload);

console.log("Signed-payload key:", chalk.green(payloadSigner.signerKey()));
console.log(
  "Payload (future transaction hash):",
  chalk.green(Buffer.from(payloadBytes).toString("hex")),
);

/**
 * The source account now submits the setup transaction at sequence `N + 1`.
 *
 * We install the `P...` signer with weight 1 and set every threshold to 1.
 * The account's master key keeps its existing weight, so it remains available
 * for cleanup. The future payment will intentionally omit that master key and
 * satisfy the medium threshold through the payload signer alone.
 */
console.log(
  chalk.bold("\n2. Installing the signed-payload signer on the account..."),
);
const installPayload = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      lowThreshold: 1,
      medThreshold: 1,
      highThreshold: 1,
      signer: {
        ed25519SignedPayload: payloadSigner.signerKey(),
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
  "Installed the transaction-bound signer:",
  chalk.green(installPayload.hash),
);

/**
 * Colibri signers explicitly declare the accounts they may authorize. This
 * target lets envelope signing match the source account requirement with the
 * signed-payload capability.
 */
payloadSigner.addTarget(account.publicKey());

/**
 * This comparison is the application's transaction-binding policy.
 *
 * Stellar verifies that the envelope contains a valid Ed25519 signature over
 * the payload stored in the `P...` key. Stellar does not independently assert
 * that the payload equals the hash of the transaction carrying that signature.
 * We therefore compare them immediately before releasing the signature.
 */
if (!Buffer.from(futurePayment.hash()).equals(Buffer.from(payloadBytes))) {
  throw new Error("The prepared transaction no longer matches the payload");
}

/**
 * The future transaction is already finalized, so we authorize those exact
 * bytes instead of sending its operations back through the build pipeline.
 *
 * `envelopeSigningRequirements` identifies which account must authorize the
 * transaction. `signEnvelope` routes that requirement to `payloadSigner`, which
 * adds the protocol-specific decorated signature over the fixed payload.
 */
console.log(
  chalk.bold("\n3. Signing and submitting the prepared payment..."),
);
const authorizedPayment = await signEnvelope({
  transaction: futurePayment,
  signatureRequirements: envelopeSigningRequirements({
    transaction: futurePayment,
  }),
  signers: [payloadSigner],
});

// This example prepares a classic transaction, not a fee-bump envelope.
if (!(authorizedPayment instanceof Transaction)) {
  throw new Error("Expected a classic transaction after envelope signing");
}

/**
 * `sendTransaction` submits the signed transaction to RPC and waits for its
 * final ledger result.
 */
const submitted = await sendTransaction({
  transaction: authorizedPayment,
  rpc,
});

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
const removePayload = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      signer: {
        ed25519SignedPayload: payloadSigner.signerKey(),
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
  "Removed the signed-payload signer:",
  chalk.green(removePayload.hash),
);
console.log(
  chalk.yellow(
    "Stellar verifies the fixed payload, not this application-level hash check. Remove persistent payload signers immediately after disclosure.",
  ),
);
