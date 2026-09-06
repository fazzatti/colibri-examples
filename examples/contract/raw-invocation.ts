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

await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  deployer.publicKey(),
  {
    rpcUrl: networkConfig.rpcUrl,
    allowHttp: networkConfig.allowHttp,
  },
);

const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

// Loading the ABI from the checked-in Wasm keeps method argument names tied to
// the actual contract. Upload stores code; deploy creates a separate instance.
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);

const counter = new Contract({
  networkConfig,
  contractConfig: { wasm },
});

// The specification describes argument names, return values, and error enums.
await counter.loadSpecFromWasm();

// Upload the code first. Other instances could reuse the same on-chain Wasm.
await counter.uploadWasm(deployerConfig);

// Deployment creates this counter's own address and storage.
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

// A raw read returns an ScVal. Check that one exists before decoding it.
const value = await counter.readRaw({ method: "count" });

if (!value) throw new Error("Expected a count return value");

const count = scValToNative(value);

console.log("Decoded raw count:", count);
