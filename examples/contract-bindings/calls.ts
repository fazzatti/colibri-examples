/**
 * Contract Bindings Example: Read and Invoke
 *
 * After `deno task generate`, use the generated counter package to deploy a
 * contract on Testnet. Compare a simulated increment with a committed one,
 * then pass a custom struct through the same typed client.
 */
import { initializeWithFriendbot } from "@colibri/core";
import { ContractMethods, Counter, CounterSummary } from "@example/counter";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "@example/counter/colibri";

/**
 * Start with Testnet's RPC and Friendbot configuration and a disposable signer.
 * These conveniences are re-exported by the generated package from Colibri.
 * Friendbot supplies the test XLM needed for deployment and invocation fees;
 * waiting for RPC visibility lets us use the new account immediately.
 */
const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

/**
 * The source account pays fees and its signer signs the transaction envelope.
 * base is the inclusion fee bid in stroops; simulation adds Soroban resource
 * fees. timeout sets the transaction's validity window in seconds.
 */
const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Generating a package creates local TypeScript files. Deployment is a separate
 * step: uploadWasm stores executable code, and deploy creates a new instance
 * with its own state and contract ID. Counter inherits these operations from
 * Colibri's Contract class and already includes the generated specification.
 */
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const counter = new Counter({ networkConfig, contractConfig: { wasm } });

await counter.uploadWasm(config);
await counter.deploy({ config });

console.log("Counter contract:", counter.getContractId());

/**
 * Read the fresh counter. The ABI method get_count becomes getCount in
 * JavaScript. It takes no arguments, so read() needs no object, and the client
 * decodes its return value to a number using the embedded specification.
 */
const initialCount = await counter.getCount.read();

console.log("Initial count:", initialCount);

/**
 * Every generated method offers read() and invoke(): the specification cannot
 * tell us which methods change state. read() simulates without committing, so
 * increment can return 3 while the stored count remains 0. Its Rust Result
 * return type becomes a Result object; unwrap() gives us the successful value.
 */
const preview = await counter.increment.read({ by: 3 });
const countAfterPreview = await counter.getCount.read();

console.log("Simulated result:", preview.unwrap());
console.log("Stored count after simulation:", countAfterPreview);

/**
 * Now commit the increment. invoke() accepts one object with methodArgs,
 * transaction config and optional auth. SorobanType.U32 validates this value
 * before encoding; the ordinary number 3 would also be accepted here.
 * The confirmed result includes both the decoded value and transaction data.
 */
const incremented = await counter.increment.invoke({
  methodArgs: { by: SorobanType.U32.from(3) },
  config,
});

if (incremented.value === undefined) {
  throw new Error(
    `No decoded result for confirmed transaction ${incremented.hash}`,
  );
}

console.log("Confirmed count:", incremented.value.unwrap());
console.log("Transaction:", incremented.hash, "ledger:", incremented.ledger);

/**
 * The generic read API remains typed too. ContractMethods.GetCount holds the
 * exact ABI spelling, "get_count". Reading again confirms that invoke changed
 * storage, and summary returns the contract's named CounterSummary struct.
 */
const storedCount = await counter.read({ method: ContractMethods.GetCount });
const summary = await counter.summary.read();

console.log("Stored count:", storedCount, "summary:", summary);

/**
 * Generated custom-type factories can prepare method arguments as well.
 * CounterSummary.from validates this struct against the contract declaration.
 * A plain summary object is also valid input; either form returns plain data.
 */
const echoed = await counter.echoSummary.read({
  summary: CounterSummary.from(summary),
});

console.log("Echoed custom value:", echoed);

if (initialCount !== 0 || countAfterPreview !== 0 || storedCount !== 3) {
  throw new Error(
    "The counter did not preserve the expected simulation/write distinction",
  );
}
