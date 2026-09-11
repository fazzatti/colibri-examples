import {
  initializeWithFriendbot,
  KNOWN_CONTRACT_ERROR_SIMULATION_FAILED,
} from "@colibri/core";
import { Counter, CounterErrors } from "./generated/index.ts";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "./generated/colibri.ts";

const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

// A fresh Testnet instance makes this lesson independent of the other scripts.
await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};

// Prepare the error map BEFORE construction. Spreading the generated entry
// preserves its spec-derived name and category while customizing the message.
const errors = {
  ...CounterErrors,
  1: {
    ...CounterErrors[1],
    message: "Choose a positive increment",
    details:
      "This counter accepts increments from 1 up to its remaining capacity.",
  },
};
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

// U32 validation accepts zero. The contract's business rule rejects it during
// simulation, so the invoke pipeline stops before submitting this invocation.
try {
  await counter.increment.invoke({
    methodArgs: { by: SorobanType.U32.from(0) },
    config,
  });

  throw new Error("increment(0) unexpectedly succeeded");
} catch (error) {
  if (!(error instanceof KNOWN_CONTRACT_ERROR_SIMULATION_FAILED)) throw error;

  // The match includes InvalidIncrement, its CounterError category and our
  // custom message. Unexpected network or deployment failures still propagate.
  console.log("Matched contract error:", error.meta.data.match);
}

const unchangedCount = await counter.getCount.read();

console.log("Count after rejected invocation:", unchangedCount);

if (unchangedCount !== 0) {
  throw new Error("The rejected invocation changed state");
}
