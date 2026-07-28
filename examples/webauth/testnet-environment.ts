import { Buffer } from "buffer";
import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NativeAccount,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { WebAuthClient } from "@colibri/webauth";
import { Keypair, rpc } from "stellar-sdk";
import { createPasskeyCredential, type PasskeyCredential } from "./passkey.ts";
import { type LocalWebAuthServer, startLocalWebAuthServer } from "./server.ts";
import { PASSKEY_ACCOUNT_SPEC } from "./contracts/specs/passkey-account.ts";
import { WEB_AUTH_SPEC } from "./contracts/specs/web-auth.ts";

export interface TestnetWebAuthEnvironment {
  client: WebAuthClient;
  contractAccount: string;
  credential: PasskeyCredential;
  network: ReturnType<typeof NetworkConfig.TestNet>;
  server: LocalWebAuthServer;
  close(): Promise<void>;
}

async function wasm(name: string): Promise<Uint8Array> {
  return await Deno.readFile(
    new URL(`./contracts/artifacts/${name}`, import.meta.url),
  );
}

export async function startTestnetWebAuthEnvironment(): Promise<
  TestnetWebAuthEnvironment
> {
  let server: LocalWebAuthServer | undefined;

  try {
    const network = NetworkConfig.TestNet();
    const rpcServer = new rpc.Server(network.rpcUrl, {
      allowHttp: network.allowHttp,
    });
    const admin = NativeAccount.fromMasterSigner(LocalSigner.generateRandom());
    const serverSigner = Keypair.random();

    await initializeWithFriendbot(network.friendbotUrl, admin.address(), {
      rpcUrl: network.rpcUrl,
      allowHttp: network.allowHttp,
    });
    await initializeWithFriendbot(
      network.friendbotUrl,
      serverSigner.publicKey() as `G${string}`,
      {
        rpcUrl: network.rpcUrl,
        allowHttp: network.allowHttp,
      },
    );

    const transactionConfig: TransactionConfig = {
      source: admin.address(),
      fee: "10000000",
      timeout: 30,
      signers: [admin.signer()],
    };
    const webAuthContract = new Contract({
      networkConfig: network,
      contractConfig: {
        wasm: await wasm("web_auth_contract.wasm"),
        spec: WEB_AUTH_SPEC,
      },
    });
    await webAuthContract.uploadWasm(transactionConfig);
    await webAuthContract.deploy({ config: transactionConfig });

    const credential = await createPasskeyCredential();
    const passkeyAccount = new Contract({
      networkConfig: network,
      contractConfig: {
        wasm: await wasm("passkey_account_contract.wasm"),
        spec: PASSKEY_ACCOUNT_SPEC,
      },
    });
    await passkeyAccount.uploadWasm(transactionConfig);
    await passkeyAccount.deploy({
      config: transactionConfig,
      constructorArgs: {
        public_key: Buffer.from(credential.publicKey),
      },
    });
    const contractAccount = passkeyAccount.getContractId();

    server = startLocalWebAuthServer({
      networkPassphrase: network.networkPassphrase,
      rpc: rpcServer,
      webAuthContractId: webAuthContract.getContractId(),
      server: serverSigner,
    });
    const client = await WebAuthClient.fromDomain(server.homeDomain, {
      network,
      allowHttp: true,
    });

    return {
      client,
      contractAccount,
      credential,
      network,
      server,
      async close() {
        await server?.close();
      },
    };
  } catch (cause) {
    await server?.close();
    throw cause;
  }
}
