/**
 * Example: Price Resource Padding Before Applying It
 *
 * Simulate, fetch network settings, calculate the additions, then assemble
 * using that same simulation. Sign and submit the resulting transaction.
 *
 * Run: deno task calculator
 */
import {
  assembleTransaction,
  buildTransaction,
  calculateResourcePadding,
  Contract,
  envelopeSigningRequirements,
  getNetworkResourceSettings,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  sendTransaction,
  signEnvelope,
  simulateTransaction,
  type TransactionConfig,
  type TransactionFee,
} from "@colibri/core";
import { nativeToScVal, Operation } from "stellar-sdk";
import { Api, Server } from "stellar-sdk/rpc";

/**
 * Fund a disposable Testnet source. The same RPC will provide the sequence
 * number, simulation and network tariffs, then accept the signed transaction.
 */
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});
using deployer = LocalSigner.generateRandom();

await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  deployer.publicKey(),
  {
    rpcUrl: networkConfig.rpcUrl,
    allowHttp: networkConfig.allowHttp,
  },
);

// Deployment uses ordinary simulation recommendations, without resource tuning.
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};
const wasm = await Deno.readFile(
  new URL("../contract/contract/counter.wasm", import.meta.url),
);
const counter = new Contract({
  networkConfig,
  contractConfig: { wasm },
});

// Deploy a fresh public counter so the invocation needs no Soroban auth entries.
await counter.loadSpecFromWasm();
await counter.uploadWasm(deployerConfig);
await counter.deploy({ config: deployerConfig });

console.log("Deployed counter:", counter.getContractId());

/**
 * Build the invocation explicitly to keep its simulation available for the
 * calculator. The Wasm ABI declares `by` as u32, hence the explicit XDR type.
 * Contract.invoke would manage these steps and simulate again on a new call.
 */
const increment = Operation.invokeContractFunction({
  contract: counter.getContractId(),
  function: "increment",
  args: [nativeToScVal(1, { type: "u32" })],
});

/**
 * max fixes the TOTAL fee bid at 1,000,000 stroops (0.1 XLM). Assembly reserves
 * the adjusted resource fee and uses the remainder for inclusion. It rejects a
 * cap without room for minimum inclusion; it does not find the cheapest bid.
 * This deliberately generous demonstration cap is not a suggested fee policy.
 */
const transactionFee: TransactionFee = { max: "1000000" };
const transaction = await buildTransaction({
  operations: [increment],
  source: deployer.publicKey(),
  networkPassphrase: networkConfig.networkPassphrase,
  rpc,
  transactionFee,
  preconditions: { timeoutSeconds: 120 },
});

/**
 * Simulation executes without committing the increment. It supplies the
 * footprint, instruction/byte recommendations and resource fee to preserve as
 * our baseline. This small flow assumes live entries and no additional auth.
 */
const simulation = await simulateTransaction({ transaction, rpc });

if (Api.isSimulationRestore(simulation)) {
  throw new Error("Restore archived entries before calculating padding.");
}

if (simulation.result?.auth.length) {
  throw new Error(
    "Resolve Soroban authorization and obtain its final simulation first.",
  );
}

const simulatedData = simulation.transactionData.build();

console.log("Simulated instructions:", simulatedData.resources.instructions);
console.log(
  "Simulated disk-read bytes:",
  simulatedData.resources.diskReadBytes,
);
console.log("Simulated write bytes:", simulatedData.resources.writeBytes);
console.log("Simulated resource fee:", simulatedData.resourceFee, "stroops");

/**
 * Fetching tariffs and per-transaction limits is explicit. The calculator has
 * no network side effects, and ordinary resource configuration never calls it.
 * Settings and simulation can observe different ledgers on the same network.
 */
const settings = await getNetworkResourceSettings({ rpc });

if (settings.networkPassphrase !== transaction.networkPassphrase) {
  throw new Error(
    "Simulation and resource settings must use the same network.",
  );
}

/**
 * Price an extra 10% of instructions and ten write bytes at the network's
 * tariffs, respecting rounding and limits. Keep the original fee allowance,
 * then add 5,000 stroops of refundable headroom after funding resource growth.
 * This is a chosen margin, not a prediction of future rent, events or state.
 */
const calculation = calculateResourcePadding({
  simulation,
  settings,
  padding: {
    instructions: { percent: 10 },
    writeBytes: { amount: 10 },
    refundableFee: { amount: "5000" },
  },
});

console.log("Concrete padding:", calculation.padding);
console.log("Additional fees (stroops):", calculation.breakdown);
console.log("Simulation ledger:", calculation.simulationLedger);
console.log("Settings ledger:", calculation.settingsLedger);
console.log("Settings protocol:", calculation.protocolVersion);

/**
 * Apply the returned padding exactly once to the SAME simulation. resourceFee
 * already includes the refundable addition: do not add those 5,000 stroops
 * again. Recalculate after changing the transaction, simulation or tariffs.
 * No auth entries are needed for this public counter's increment method.
 */
const prepared = await assembleTransaction({
  transaction,
  sorobanData: simulation.transactionData,
  authEntries: [],
  resources: { padding: calculation.padding },
  transactionFee,
});

console.log("Prepared total fee bid:", prepared.fee, "stroops");

/**
 * Sign only after the final budgets and fee are assembled: signatures bind the
 * whole envelope. Even an invocation without Soroban auth entries still needs
 * the source account's transaction signature.
 */
const signatureRequirements = envelopeSigningRequirements({
  transaction: prepared,
});
const signed = await signEnvelope({
  transaction: prepared,
  signatureRequirements,
  signers: [deployer],
});

// Submission waits for confirmation; the ledger result reports the actual fee.
const result = await sendTransaction({ transaction: signed, rpc });

console.log("Increment transaction:", result.hash);
console.log("Actual charge:", result.response.resultXdr.feeCharged, "stroops");

// Read committed state to verify the increment reached the ledger.
const count = await counter.read({ method: "count" });

if (count !== 1) {
  throw new Error(`Expected the confirmed counter to be 1; received ${count}.`);
}

console.log("Counter after confirmation:", count);
