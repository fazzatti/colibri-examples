/**
 * Example: Generic Contract Calls
 *
 * Load a counter specification, upload its Wasm and deploy a new instance.
 * Read the initial state, invoke an increment and read again to observe the
 * committed change.
 *
 * Run: deno task counter
 */
import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";

/**
 * The deployer pays for uploading code, creating an instance and invoking
 * it. Friendbot supplies disposable Testnet XLM; waiting for RPC visibility
 * makes that funded source ready for the next step.
 */
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

/**
 * The transaction configuration names its source account and the signers
 * allowed to satisfy its requirements. base is an inclusion bid per
 * operation in stroops; Soroban simulation adds resource fees when needed.
 * timeout sets transaction validity in seconds, not an RPC request deadline.
 */
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Loading the ABI from the checked-in Wasm keeps method argument names tied
 * to the actual contract. Upload stores code; deploy creates a separate
 * instance.
 */
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

// Reads simulate and decode a return value, without submitting a transaction.
const countBefore = await counter.read({ method: "count" });

console.log("Before:", countBefore);

/**
 * This counter is deliberately public and unprotected, for learning only.
 * Writes use the owned invoke pipeline: simulate, authorize, assemble, sign,
 * submit, confirm. The return includes the confirmed transaction
 * information.
 */
const incremented = await counter.invoke({
  method: "increment",
  methodArgs: { by: 3 },
  config: deployerConfig,
});

console.log("Increment transaction:", incremented.hash);

// Read the confirmed state again; a transaction hash alone is not the value.
const countAfter = await counter.read({ method: "count" });

console.log("After:", countAfter);
