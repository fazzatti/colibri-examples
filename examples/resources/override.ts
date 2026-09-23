/**
 * Example: Choose Absolute Resource Budgets
 *
 * Replace selected simulated recommendations with explicit final declarations.
 * The values are budgets for the submitted transaction, not simulation caps.
 *
 * Run: deno task override
 */
import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { TransactionBuilder } from "stellar-sdk";

/**
 * This account pays for a new counter and its invocation. Friendbot supplies
 * Testnet XLM and the helper waits until the source account is visible to RPC.
 * No existing account or private key is needed.
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
 * inclusion is the whole transaction's inclusion bid in stroops. Unlike base,
 * it is not multiplied by the operation count. Soroban resource fees are added
 * to this bid after simulation. This lesson submits one operation at a time.
 */
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { inclusion: "100" },
  timeout: 120,
};

/**
 * Use the generic-contract lesson's Wasm, so no Rust build is needed. Each run
 * deploys its own instance; sharing the code does not share the counter value.
 */
const wasm = await Deno.readFile(
  new URL("../contract/contract/counter.wasm", import.meta.url),
);
const counter = new Contract({
  networkConfig,
  contractConfig: { wasm },
});

// The ABI lets invoke accept named arguments and lets read decode the count.
await counter.loadSpecFromWasm();
await counter.uploadWasm(deployerConfig);
await counter.deploy({ config: deployerConfig });

console.log("Deployed counter:", counter.getContractId());

/**
 * Override means an absolute final value: 12,000,000 instructions and a TOTAL
 * resource fee of 100,000 stroops (0.01 XLM). The separate 100-stroop inclusion
 * bid makes the total envelope bid 100,100 stroops. Omitted byte budgets retain
 * their simulation recommendations.
 *
 * These demonstration values are a deliberate manual policy, not recommended
 * defaults. Increasing instructions does not automatically increase the fee;
 * the caller must fund the declared budget and respect the network limits.
 *
 * Simulation still runs normally. If its final recommendation exceeds either
 * override, Colibri rejects assembly with RES_002 before envelope signing.
 * Setting instructions here does NOT make the simulator stop at that value.
 * Do not also pad the same field: override and padding are mutually exclusive
 * for each resource, although different fields may use different branches.
 */
const result = await counter.invoke({
  method: "increment",
  methodArgs: { by: 1 },
  config: {
    ...deployerConfig,
    resources: {
      override: {
        instructions: 12_000_000,
        resourceFee: "100000",
      },
    },
  },
});

// Inspect what was submitted and charged, rather than equating a bid to a cost.
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const confirmed = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

console.log("Increment transaction:", result.hash);
console.log("Confirmed total fee bid:", confirmed.fee, "stroops");
console.log("Actual charge:", result.response.resultXdr.feeCharged, "stroops");

// A simulated read after confirmation shows the counter's committed value.
const count = await counter.read({ method: "count" });

if (count !== 1) {
  throw new Error(`Expected the confirmed counter to be 1; received ${count}.`);
}

console.log("Counter after confirmation:", count);
