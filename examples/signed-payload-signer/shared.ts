/**
 * Shared transaction helpers for the signed-payload example.
 *
 * The interesting authorization policy remains in `signed-payload.ts`. This
 * module exposes the lower-level mechanics needed to plan sequence numbers,
 * update account signers, sign one already-finalized envelope, and submit it
 * without rebuilding it.
 */
import {
  buildTransaction,
  createClassicTransactionPipeline,
  envelopeSigningRequirements,
  initializeWithFriendbot,
  type LocalSigner,
  NetworkConfig,
  sendTransaction,
  signEnvelope,
  type Signer,
  type TransactionConfig,
} from "@colibri/core";
import { Transaction, type xdr } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";

const BASE_FEE = "100" as const;
const TIMEOUT = 120;
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});

/**
 * The setup and cleanup transactions are ordinary classic transactions signed
 * by the account's master key, so Colibri's classic pipeline can build and
 * submit them end to end.
 */
const classicPipeline = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

/**
 * Creates a classic transaction configuration.
 *
 * The `signers` array can contain different signer implementations. Colibri
 * inspects the transaction requirements and invokes only capabilities that
 * declare they can satisfy the relevant account.
 */
const configFor = (
  source: ReturnType<LocalSigner["publicKey"]>,
  signers: TransactionConfig["signers"],
): TransactionConfig => ({
  source,
  fee: BASE_FEE,
  timeout: TIMEOUT,
  signers,
});

/**
 * Uses Friendbot to create disposable Testnet accounts.
 *
 * This removes unrelated account bootstrapping from the example. Production
 * systems should replace Friendbot with their own account lifecycle.
 */
export async function fund(
  ...signers: LocalSigner[]
): Promise<void> {
  for (const signer of signers) {
    console.log(`Funding ${signer.publicKey()} with Friendbot...`);
    await initializeWithFriendbot(
      networkConfig.friendbotUrl,
      signer.publicKey(),
      {
        rpcUrl: networkConfig.rpcUrl,
        allowHttp: networkConfig.allowHttp,
      },
    );
  }
}

/**
 * Runs a single `setOptions` operation with the account's existing master key.
 *
 * This helper is used both to install the `P...` signer with weight 1 and to
 * remove it later with weight 0.
 */
export async function installAccountSigner(
  account: LocalSigner,
  signerOperation: xdr.Operation,
): Promise<string> {
  const result = await classicPipeline.run({
    operations: [signerOperation],
    config: configFor(account.publicKey(), [account]),
  });
  return result.hash;
}

/**
 * Builds a transaction whose sequence follows one setup transaction.
 *
 * Suppose RPC reports the account's current sequence as `N`:
 *
 * - the setup transaction built later by `classicPipeline` consumes `N + 1`;
 * - `buildTransaction` itself increments the sequence supplied to it; therefore
 * - supplying `N + 1` creates the future transaction at `N + 2`.
 *
 * This lets us hash the exact future transaction before the setup transaction
 * installs a signer derived from that hash.
 */
export async function buildAfterSetup(
  source: ReturnType<LocalSigner["publicKey"]>,
  operations: xdr.Operation[],
): Promise<Transaction> {
  const account = await rpc.getAccount(source);
  const sequenceBeforeFuture = (
    BigInt(account.sequenceNumber()) + 1n
  ).toString();

  return await buildTransaction({
    source,
    baseFee: BASE_FEE,
    networkPassphrase: networkConfig.networkPassphrase,
    sequence: sequenceBeforeFuture,
    operations,
    preconditions: {
      timeoutSeconds: TIMEOUT,
    },
  });
}

/**
 * Signs and submits an already-finalized transaction without rebuilding it.
 *
 * Rebuilding would risk changing hash-affecting fields and invalidating the
 * payload policy. `envelopeSigningRequirements` identifies the accounts that
 * must authorize the prepared envelope. `signEnvelope` routes those
 * requirements to the supplied signer capabilities, and `sendTransaction`
 * waits for RPC confirmation.
 */
export async function authorizeAndSubmit(
  transaction: Transaction,
  signers: Signer[],
): Promise<{
  transaction: Transaction;
  hash: string;
  ledger: number;
}> {
  const authorized = await signEnvelope({
    transaction,
    signatureRequirements: envelopeSigningRequirements({ transaction }),
    signers,
  });

  // This example prepares a classic transaction, not a fee-bump envelope.
  if (!(authorized instanceof Transaction)) {
    throw new Error("Expected a classic transaction after envelope signing");
  }
  const result = await sendTransaction({
    transaction: authorized,
    rpc,
  });

  return {
    transaction: authorized,
    hash: result.hash,
    ledger: result.ledger,
  };
}
