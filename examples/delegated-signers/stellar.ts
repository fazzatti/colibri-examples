import {
  initializeWithFriendbot,
  type LocalSigner,
  NetworkConfig,
} from "@colibri/core";
import { Server } from "stellar-sdk/rpc";

export const networkConfig = NetworkConfig.TestNet();
export const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
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
