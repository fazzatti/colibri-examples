import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { KNOWN_CONTRACT_ERROR_SIMULATION_FAILED } from "@colibri/core";
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

// The Wasm specification contains the contract's named error enum.
// Scope the matcher to this contract ID so unrelated contracts with error 1
// cannot accidentally be labelled as our counter's error.
await counter.loadContractErrorsFromWasm({ strategy: "contract-id" });
try {
  await counter.invoke({ method: "reject", config: deployerConfig });
  throw new Error("The deliberately rejecting method unexpectedly succeeded");
} catch (error) {
  if (!(error instanceof KNOWN_CONTRACT_ERROR_SIMULATION_FAILED)) throw error;
  console.log("Matched contract error:", error.meta.data.match);
}
// This failure occurs during simulation: no rejecting transaction is submitted.
