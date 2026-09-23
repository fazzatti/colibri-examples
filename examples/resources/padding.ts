/**
 * Example: Add Headroom to Simulated Resources
 *
 * Give a counter invocation extra instructions, write bytes, and resource fees.
 * Fixed amounts and percentages can coexist on different resource fields.
 *
 * Run: deno task padding
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
 * Fund a disposable Testnet account for deployment and invocation. Waiting for
 * RPC visibility makes the funded account ready to supply a sequence number.
 * The signer stays in memory and is disposed when this script finishes.
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
 * Inclusion and resource fees are separate. base is a per-operation inclusion
 * bid in stroops; the simulated resource fee is added for Soroban operations.
 * timeout is the transaction's validity window in seconds.
 */
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Reuse the generic-contract lesson's checked-in Wasm. Upload stores its code;
 * deployment creates a fresh counter with separate storage, initially zero.
 * This public teaching contract deliberately requires no Soroban auth entries.
 */
const wasm = await Deno.readFile(
  new URL("../contract/contract/counter.wasm", import.meta.url),
);
const counter = new Contract({
  networkConfig,
  contractConfig: { wasm },
});

// Load the ABI so Colibri can encode the named `by` argument and decode reads.
await counter.loadSpecFromWasm();
await counter.uploadWasm(deployerConfig);
await counter.deploy({ config: deployerConfig });

console.log("Deployed counter:", counter.getContractId());

/**
 * Padding adds to the FINAL simulation recommendation, once, before envelope
 * signing. Ten percent means an extra 10%, rounded up to whole instructions.
 * writeBytes adds ten BYTES of budget; it does not write ten bytes itself.
 * diskReadBytes is omitted, so its simulated recommendation stays unchanged.
 *
 * Manually increasing instructions or bytes does not automatically price them.
 * The 5,000-stroop fee addition is an explicit demonstration allowance, not a
 * quote or guaranteed refundable margin. calculator.ts prices resource growth
 * separately before adding the refundable headroom that you request.
 */
const result = await counter.invoke({
  method: "increment",
  methodArgs: { by: 1 },
  config: {
    ...deployerConfig,
    resources: {
      padding: {
        instructions: { percent: 10 },
        writeBytes: { amount: 10 },
        resourceFee: { amount: "5000" },
      },
    },
  },
});

/**
 * The confirmed envelope contains the adjusted resource fee PLUS the inclusion
 * bid. The actual charge can be lower. One XLM equals 10,000,000 stroops.
 */
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const confirmed = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

console.log("Increment transaction:", result.hash);
console.log("Confirmed total fee bid:", confirmed.fee, "stroops");
console.log("Actual charge:", result.response.resultXdr.feeCharged, "stroops");

// Read the committed state to verify the invocation did more than simulate.
const count = await counter.read({ method: "count" });

if (count !== 1) {
  throw new Error(`Expected the confirmed counter to be 1; received ${count}.`);
}

console.log("Counter after confirmation:", count);
