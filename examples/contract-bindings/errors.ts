/**
 * Contract Bindings Example: Contract Errors
 *
 * After `deno task generate`, customize the generated error map and deploy a
 * fresh Testnet counter. A rejected increment will show how Colibri connects
 * a numeric contract error to its name, category and descriptive message.
 */
import {
  initializeWithFriendbot,
  KNOWN_CONTRACT_ERROR_SIMULATION_FAILED,
} from "@colibri/core";
import { Counter, CounterErrors } from "@example/counter";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "@example/counter/colibri";

/**
 * Fund a disposable Testnet signer so this script can deploy its own counter.
 * Each networked lesson creates an independent instance; running calls.ts first
 * does not change the starting state here. Friendbot provides test XLM only.
 */
const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

/**
 * Use the funded account as the transaction source and envelope signer.
 * The inclusion bid is in stroops, resource fees are added by simulation,
 * and timeout is the transaction validity window in seconds.
 */
const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Rust declares error code 1 as InvalidIncrement in the CounterError enum.
 * Generation preserves that name, uses CounterError as its category, and reads
 * the description from the spec. Copy the map to customize its message while
 * preserving that metadata and all other errors. Prepare it before construction.
 */
const errors = {
  ...CounterErrors,
  1: {
    ...CounterErrors[1],
    message: "Choose a positive increment",
    details:
      "This counter accepts increments from 1 up to its remaining capacity.",
  },
};

/**
 * Counter installs the prepared map when constructed. Upload the Wasm and
 * deploy a new instance, just as in the calls example. The error matcher will
 * recognize failures returned by this counter's invocation.
 */
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const counter = new Counter({
  networkConfig,
  contractConfig: { wasm },
  errors,
});

await counter.uploadWasm(config);
await counter.deploy({ config });

/**
 * Zero is a valid U32, but the counter only accepts positive increments.
 * invoke() simulates before submission, so this contract rejection stops the
 * pipeline before a transaction is sent. Handle the expected matched error;
 * unrelated failures should still stop the example rather than appear successful.
 */
try {
  await counter.increment.invoke({
    methodArgs: { by: SorobanType.U32.from(0) },
    config,
  });

  throw new Error("increment(0) unexpectedly succeeded");
} catch (error) {
  if (!(error instanceof KNOWN_CONTRACT_ERROR_SIMULATION_FAILED)) throw error;

  // Inspect InvalidIncrement, its CounterError category and our custom message.
  console.log("Matched contract error:", error.meta.data.match);
}

/**
 * Finally, read the stored count. It remains zero because the failed simulation
 * did not commit an increment to the ledger.
 */
const unchangedCount = await counter.getCount.read();

console.log("Count after rejected invocation:", unchangedCount);

if (unchangedCount !== 0) {
  throw new Error("The rejected invocation changed state");
}
