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
