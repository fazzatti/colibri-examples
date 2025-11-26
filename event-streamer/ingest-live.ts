import { EventStreamer } from "@colibri/event-streamer";
import {
  EventFilter,
  EventHandler,
  EventType,
  NetworkProviders,
} from "@colibri/core";
import { scValToNative, xdr } from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";
import chalk from "chalk";

console.log(
  chalk.bgBlue(
    chalk`Starting the Event Streamer live ingestion for XLM transfer events...`
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
 * We setup a Event Filter to capture only `transfer` events
 * emitted by the XLM contract on Mainnet.
 *
 * These can have any number and combination of topic segments
 * after the `transfer` function name as we use a double wildcard (`**`).
 */
const filter = new EventFilter({
  contractIds: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"], // XLM Contract ID in Mainnet
  type: EventType.Contract,
  topics: [[xdr.ScVal.scvSymbol("transfer"), "**"]],
});

/**
 * We'll be ingesting events for the next 5 ledgers only.
 * So we'll load the latest ledger and set the stopLedger
 * to 5 ledgers after that.
 */
const server = new Server(networkConfig.rpcUrl);
const latestLedger = await server.getLatestLedger();
const stopLedger = latestLedger.sequence + 5;

console.log(
  `Latest ledger is ${chalk.green(
    latestLedger.sequence
  )}, will stop ingestion at ledger ${chalk.green(stopLedger)}`
);

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
  // Here we simply log the event details to the console
  console.log(`\nEvent received with id: ${chalk.green(event.id)}`);
  console.log(`  > Ledger ${chalk.green(event.ledger)}`);
  console.log(`  > Transaction ${chalk.green(event.txHash)}`);
  console.log(
    `  > Topics ${chalk.green(event.topic.map((t) => scValToNative(t)))}`
  );
  console.log(`  > Value ${chalk.green(scValToNative(event.value))}`);
  // Increment and log the counter
  counter++;
};

/**
 * Finally we start the live ingestion process
 * passing our event handler and stopLedger
 * so the ingestion stops after that ledger. This
 * is an 'inclusive' condition so the stopLedger is
 * included in the ingestion.
 *
 * By not providing a `startLedger`, the ingestion
 * will start from the latest ledger available
 * in the normal RPC.
 *
 * Since we are starting at the latest ledger,
 * the `start` function will automatically identify
 * that it falls within the normal RPC retention window
 * and will use the live ingestion mode instead of
 * the historical ingestion mode.
 *
 * Alternatively, one can explicitely use the `startLive`
 * method to indicate that we want to start live ingestion.
 * By explicitely using the `startLive` method, the ingestion
 * will fail if the `startLedger` falls outside the normal
 * RPC retention window.
 *
 */
console.log(`Starting live ingestion...`);
await eventStreamer.start(onEvent, { stopLedger });

console.log(`\nIngestion completed. Processed ${chalk.green(counter)} events.`);
Deno.exit(0);
