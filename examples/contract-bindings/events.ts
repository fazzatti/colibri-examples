import { Event, initializeWithFriendbot } from "@colibri/core";
import { Counter } from "./generated/index.ts";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "./generated/colibri.ts";

const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

// Deploy an isolated instance so the event query cannot include another
// lesson's increments. Friendbot uses only disposable Testnet funds.
await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const counter = new Counter({ networkConfig, contractConfig: { wasm } });

await counter.uploadWasm(config);
await counter.deploy({ config });

// Access definitions AFTER deployment so they are bound to the new contract ID.
// Only indexed fields can be filtered; old_count and new_count are payload data.
const definition = counter.events.CountChanged;
const filter = definition.toEventFilter({
  action: SorobanType.Symbol.from("increment"),
});

console.log("RPC event filter:", filter.toRawEventFilter());

const incremented = await counter.increment.invoke({
  methodArgs: { by: 5 },
  config,
});

// Query committed events from the confirmed transaction's ledger. The generated
// definition supplies the contract restriction and correctly encoded topics.
const response = await counter.rpc.getEvents({
  startLedger: incremented.ledger,
  filters: [filter.toRawEventFilter()],
  limit: 10,
});
const occurrence = response.events.find((event) =>
  event.txHash === incremented.hash
);

if (!occurrence) {
  throw new Error(
    `Event not indexed for ${incremented.hash}. Retry the event query; do not resubmit the increment.`,
  );
}

// Normalize the RPC event with Core, then validate and decode its declared
// fields. The typed occurrence retains ledger, transaction and raw XDR metadata.
const event = Event.fromEventResponse(occurrence);
const changed = definition.fromEvent(event);

console.log("Action:", changed.fields.action);
console.log("Count:", changed.fields.old_count, "->", changed.fields.new_count);
console.log("Ledger:", changed.ledger, "transaction:", changed.txHash);

if (changed.fields.old_count !== 0 || changed.fields.new_count !== 5) {
  throw new Error("Unexpected counter event payload");
}
