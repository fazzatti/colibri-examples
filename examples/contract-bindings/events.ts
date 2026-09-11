/**
 * Contract Bindings Example: Events
 *
 * After `deno task generate`, deploy a Testnet counter, invoke an increment,
 * and retrieve its CountChanged event. The generated definition supplies typed
 * topic filters and decodes the event fields from the contract specification.
 */
import { Event, initializeWithFriendbot } from "@colibri/core";
import { Counter } from "@example/counter";
import {
  LocalSigner,
  NetworkConfig,
  SorobanType,
  type TransactionConfig,
} from "@example/counter/colibri";

/**
 * Start with a disposable Testnet signer funded through Friendbot. Deploying a
 * separate counter keeps this query independent of events from other lessons.
 * Waiting for RPC visibility ensures the funded account is ready to use.
 */
const networkConfig = NetworkConfig.TestNet();
using signer = LocalSigner.generateRandom();

await initializeWithFriendbot(networkConfig.friendbotUrl, signer.publicKey(), {
  rpcUrl: networkConfig.rpcUrl,
});

/**
 * This signer pays and signs for deployment and the increment. The inclusion
 * fee bid is in stroops; simulation adds resource fees. timeout sets the
 * transaction validity window in seconds.
 */
const config: TransactionConfig = {
  source: signer.publicKey(),
  signers: [signer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * The generated package contains the client, but not a deployed instance.
 * Upload the counter's Wasm and deploy it to obtain a contract ID. That ID
 * will restrict the event filter to events emitted by this counter.
 */
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const counter = new Counter({ networkConfig, contractConfig: { wasm } });

await counter.uploadWasm(config);
await counter.deploy({ config });

/**
 * Read the definition after deployment so it is bound to the new contract ID.
 * Rust marks action as an indexed topic, so we can filter for "increment".
 * old_count and new_count are payload fields: we decode them after retrieval.
 * The definition also supplies the contract's static "count_changed" topic.
 */
const definition = counter.events.CountChanged;
const filter = definition.toEventFilter({
  action: SorobanType.Symbol.from("increment"),
});

console.log("RPC event filter:", filter.toRawEventFilter());

/**
 * Commit an increment of five. We need invoke() here: a simulated read would
 * not produce an event in the network's committed event history.
 */
const incremented = await counter.increment.invoke({
  methodArgs: { by: 5 },
  config,
});

/**
 * Query from the confirmed transaction's ledger using the encoded filter.
 * Match the transaction hash so we decode the occurrence from this increment.
 * If indexing is delayed, retry the query; resubmitting would increment again.
 */
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

/**
 * Normalize the RPC response into a Colibri Event, then decode it using the
 * generated definition. fields now exposes the declared action, old_count
 * and new_count types alongside ledger and transaction metadata.
 */
const event = Event.fromEventResponse(occurrence);
const changed = definition.fromEvent(event);

console.log("Action:", changed.fields.action);
console.log("Count:", changed.fields.old_count, "->", changed.fields.new_count);
console.log("Ledger:", changed.ledger, "transaction:", changed.txHash);

if (changed.fields.old_count !== 0 || changed.fields.new_count !== 5) {
  throw new Error("Unexpected counter event payload");
}
