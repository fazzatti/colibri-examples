import { initializeWithFriendbot } from "@colibri/core";
import { ContractMethods, Counter, CounterSummary } from "./generated/index.ts";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "./generated/colibri.ts";

// These are the original Core conveniences re-exported by the generated client.
// Friendbot funds a disposable Testnet signer and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};

// The generated constructor already installs the embedded spec and error map.
// Upload stores the code; deploy creates this script's separate counter instance.
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const counter = new Counter({ networkConfig, contractConfig: { wasm } });

await counter.uploadWasm(config);
await counter.deploy({ config });

console.log("Counter contract:", counter.getContractId());

// get_count in the ABI becomes getCount in JavaScript. With no arguments,
// read() needs no object and returns a typed number.
const initialCount = await counter.getCount.read();

console.log("Initial count:", initialCount);

// Even a state-changing function has read(): this simulates increment but
// commits nothing. Rust Result<u32, CounterError> decodes to an SDK Result.
const preview = await counter.increment.read({ by: 3 });
const countAfterPreview = await counter.getCount.read();

console.log("Simulated result:", preview.unwrap());
console.log("Stored count after simulation:", countAfterPreview);

// invoke takes ONE object: methodArgs, config and optional auth. Validated
// Soroban values and ordinary numbers are accepted by the same method.
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

// The generic API is still typed. The enum keeps the exact ABI value
// "get_count", while its JavaScript identifier is GetCount.
const storedCount = await counter.read({ method: ContractMethods.GetCount });
const summary = await counter.summary.read();

console.log("Stored count:", storedCount, "summary:", summary);

// A generated custom-type factory also works directly as a method argument.
// Passing the plain summary object here is valid too; the output stays plain.
const echoed = await counter.echoSummary.read({
  summary: CounterSummary.from(summary),
});

console.log("Echoed custom value:", echoed);

if (initialCount !== 0 || countAfterPreview !== 0 || storedCount !== 3) {
  throw new Error(
    "The counter did not preserve the expected simulation/write distinction",
  );
}
