import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
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

// Reads simulate and decode a return value, without submitting a transaction.
console.log("Before:", await counter.read({ method: "count" }));

// Writes use the owned invoke pipeline: simulate, authorize, assemble, sign,
// submit, confirm. The return includes the confirmed transaction information.
const incremented = await counter.invoke({
  method: "increment",
  methodArgs: { by: 3 },
  config: deployerConfig,
});
console.log("Increment transaction:", incremented.hash);
console.log("After:", await counter.read({ method: "count" }));
// The counter is deliberately public and unprotected, for learning only.
