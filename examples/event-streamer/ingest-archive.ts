import { EventStreamer, EventFilter } from "@colibri/event-streamer";
import {
  EventHandler,
  EventType,
  NetworkProviders,
  SACEvents,
} from "@colibri/core";
import chalk from "chalk";

console.log(
  chalk.bgBlue(
    `Starting the Event Streamer archive ingestion for KALE mint events...`
  )
);

/**
 * In this example we'll use the public network infrastructre
 * provided by Lightsail. You can replace this with your own
 * NetworkConfig or other predefined setups.
 *
 */
const networkConfig = NetworkProviders.Lightsail.MainNet();

/**
 * We setup a Event Filter to capture only `mint` events
 * emitted by the KALE contract on Mainnet.
 *
 * These can have any number and combination of topic segments
 * after the `mint` function name as we use a double wildcard (`**`).
 *
 * In this example, we load the SACEvents helper, which contains
 * predefined event structures for the SAC (Stellar Asset Contract),
 * including the `MintEvent` type we use here.
 *
 * With this helper, we can easily create the topic filter
 * for the `mint` event using the `toTopicFilter` method.
 *
 * By not providing any additional conditions to the `toTopicFilter` method,
 * we indicate we want to capture all `mint` events regardless
 * of their parameters.
 *
 * If needed, we could provide specific parameter values to filter
 * only a subset of the `mint` events, such as those minting a specific asset
 * or to a specific recipient.
 */
const filter = new EventFilter({
  contractIds: ["CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV"], // KALE Contract ID in Mainnet
  type: EventType.Contract,
  topics: [SACEvents.MintEvent.toTopicFilter()],
});

/**
 * We'll be ingesting events for a single historical ledger only.
 * Ledger number: 59895694
 * (This should contain 9 KALE mint events)
 *
 */
const startLedger = 59895694;
const stopLedger = 59895694;

console.log(
  `Will ingest events from historical ledger ${chalk.green(startLedger)}.`
);
console.log(`We expect to find ${chalk.green("9")} KALE mint events.`);

/**
 * Now we can create the EventStreamer instance
 * with our filter and network configuration.
 *
 * We also set options to control the polling
 * interval for new ledgers and the paging
 * interval when fetching multiple events
 * from a single ledger.
 */
const eventStreamer = new EventStreamer({
  rpcUrl: networkConfig.rpcUrl,
  archiveRpcUrl: networkConfig.archiveRpcUrl,
  filters: [filter],
  options: {
    waitLedgerIntervalMs: 5000, // 5 seconds between each ledger check
    pagingIntervalMs: 500, // 0.5 second between each page when fetching multiple events from a ledger
  },
});

// A simple counter to keep track of the number of events processed
let counter = 0;

/**
 * We define the event handler function which will be called
 * for each event that fits our filtering conditions as the
 * streamer ingests new ledgers
 */
const onEvent: EventHandler = (event) => {
  // We can use the SACEvents helper to parse the raw event
  // into a structured MintEvent instance. This gives us
  // easy access to the event parameters as well as
  // type-checking and validation.
  const mintEvent = SACEvents.MintEvent.fromEvent(event);

  // Here we simply log the event details to the console
  console.log(`\nEvent received with id: ${chalk.green(mintEvent.id)}`);
  console.log(`  > Ledger ${chalk.green(mintEvent.ledger)}`);
  console.log(`  > Transaction ${chalk.green(mintEvent.txHash)}`);
  console.log(`  > To ${chalk.green(mintEvent.to)}`);
  console.log(`  > Amount ${chalk.green(mintEvent.amount)}`);
  console.log(`  > Asset ${chalk.green(mintEvent.asset)}`);

  // Increment and log the counter
  counter++;
};

/**
 * Finally we start the archival ingestion process
 * passing our event handler and target ledgers.
 * By providing both the same ledger as `startLedger`
 * and `stopLedger`, we indicate we want to ingest
 * events from that single historical ledger.
 *
 * Since we are starting with a target historical ledger,
 * that falls outside the normal RPC retention window,
 * the Event Streamer will automatically use the archival
 * ingestion mode.
 *
 * If we targeted a range that would shift from outside of
 * the retention window to inside of it, the Event Streamer
 * would automatically switch from archival ingestion to
 * live ingestion when reaching the point where the normal
 * RPC can be used.
 */
console.log(`Starting archive ingestion...`);
await eventStreamer.start(onEvent, {
  startLedger,
  stopLedger,
});

console.log(`\nIngestion completed. Processed ${chalk.green(counter)} events.`);
Deno.exit(0);
