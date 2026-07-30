/**
 * Shared transaction helpers for the pre-authorized transaction example.
 *
 * The main script teaches the `T...` signer lifecycle. This module documents
 * the sequence planning and low-level submission mechanics that let us install
 * a hash in one transaction and submit the exact hashed transaction next.
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
export const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});

/**
 * The setup transaction is an ordinary master-key-authorized account update,
 * so Colibri's classic pipeline can build, sign, submit, and confirm it.
 */
const classicPipeline = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

/**
 * Every transaction needs a source account, a fee, a timeout, and signers.
 *
 * The caller selects the signers because setup uses the account's master key,
 * while the future payment is authorized by its pre-authorized `T...` signer.
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
 * Friendbot creates and funds disposable Testnet accounts. Never use Friendbot
 * or randomly generated demonstration keys for production accounts.
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
 * Submits the account update that installs the future transaction's hash as a
 * signer. The account's master key authorizes this setup transaction.
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
 * If the current account sequence is `N`, the setup transaction will use
 * `N + 1`. Because `buildTransaction` increments the sequence passed to it, we
 * pass `N + 1` to prepare the future transaction at `N + 2`.
 *
 * Preparing those exact bytes first is mandatory: the account signer installed
 * by setup is the hash of this complete transaction.
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
 * Authorizes an already-finalized transaction and submits those same bytes.
 *
 * A `PreAuthorizedTransactionSigner` verifies that its stored hash matches the
 * transaction. It deliberately adds no decorated signature because Stellar
 * reads the matching transaction hash from the source account itself.
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
