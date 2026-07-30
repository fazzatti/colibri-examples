/**
 * Shared Testnet infrastructure for the Hash-X example.
 *
 * The main script focuses on the signer lifecycle. This module keeps the
 * repeated network, transaction-config, Friendbot, and account-update mechanics
 * in one place while documenting what Colibri does at each boundary.
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  type LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { type xdr } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";

const BASE_FEE = "100" as const;
const TIMEOUT = 120;
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});

/**
 * Hash-X signs a classic transaction envelope, so we use Colibri's classic
 * pipeline rather than the Soroban contract-invocation pipeline.
 */
export const classicPipeline = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

/**
 * Creates the common transaction configuration used throughout the example.
 *
 * `source` is the account whose sequence number is consumed and whose
 * authorization requirements must be satisfied. `signers` tells Colibri which
 * signer capabilities are available for that transaction.
 */
export const configFor = (
  source: ReturnType<LocalSigner["publicKey"]>,
  signers: TransactionConfig["signers"],
): TransactionConfig => ({
  source,
  fee: BASE_FEE,
  timeout: TIMEOUT,
  signers,
});

/**
 * Creates each disposable Testnet account through Friendbot.
 *
 * Friendbot is appropriate for examples because it creates and funds accounts
 * without requiring a pre-funded distribution account. Production software
 * should use its own account-creation and funding strategy.
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
 * Submits one account-management operation using the account's master key.
 *
 * Installing or removing an account signer changes future authorization
 * policy, so those operations must themselves be authorized by a signer that
 * already controls the account.
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
