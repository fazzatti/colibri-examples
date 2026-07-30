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

export const BASE_FEE = "100" as const;
export const TIMEOUT = 120;
export const networkConfig = NetworkConfig.TestNet();
export const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});
export const classicPipeline = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

export const configFor = (
  source: ReturnType<LocalSigner["publicKey"]>,
  signers: TransactionConfig["signers"],
): TransactionConfig => ({
  source,
  fee: BASE_FEE,
  timeout: TIMEOUT,
  signers,
});

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
 * `buildTransaction` increments the supplied account sequence. Passing the
 * current sequence plus one therefore prepares the transaction at
 * `current + 2`.
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
