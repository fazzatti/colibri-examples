import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { nativeToScVal, scValToNative } from "stellar-sdk";
// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using deployer = LocalSigner.generateRandom();
for (const signer of [deployer]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

// Loading the ABI from the checked-in Wasm keeps method argument names tied to
// the actual contract. Upload stores code; deploy creates a separate instance.
const counter = new Contract({
  networkConfig,
  contractConfig: {
    wasm: await Deno.readFile(
      new URL("./contract/counter.wasm", import.meta.url),
    ),
  },
});
await counter.loadSpecFromWasm();
await counter.uploadWasm(deployerConfig);
await counter.deploy({ config: deployerConfig });
console.log("Deployed counter:", counter.getContractId());

// A raw invocation is the native SDK escape hatch. The function name and ScVal
// arguments are supplied explicitly instead of encoded through the loaded ABI.
await counter.invokeRaw({
  operationArgs: {
    function: "increment",
    args: [nativeToScVal(2, { type: "u32" })],
  },
  config: deployerConfig,
});
const value = await counter.readRaw({ method: "count" });
if (!value) throw new Error("Expected a count return value");
console.log("Decoded raw count:", scValToNative(value));
