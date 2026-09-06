/**
 * Example: Ingest live XLM transfer events using RPCStreamer (event variant)
 *
 * This example connects to the public Lightsail Mainnet
 * network infrastructure, but you can replace this
 * with your own NetworkConfig or other predefined setups.
 *
 * The example sets up an Event Filter to capture only
 * `transfer` events emitted by the XLM contract on Mainnet.
 *
 * It then ingests events from new ledgers as they are
 * produced on the network, for a total of 5 ledgers.
 *
 * For each event received, the example logs the event details
 * to the console.
 */
import { RPCStreamer } from "@colibri/rpc-streamer";
import {
  Event,
  EventFilter,
  EventType,
  NetworkProviders,
  SACEvents,
} from "@colibri/core";
import { Server } from "stellar-sdk/rpc";
import chalk from "chalk";

console.log(
  chalk.bgBlue(
    chalk`Starting the RPC streamer live ingestion for XLM transfer events...`,
  ),
);

/**
 * In this example we'll use the public network infrastructre
 * provided by Lightsail. You can replace this with your own
 * NetworkConfig or other predefined setups.
 */
const networkConfig = NetworkProviders.Lightsail.MainNet();

/**
 * We setup a Event Filter to capture only `transfer` events
 * emitted by the XLM contract on Mainnet.
 *
 * These can have any number and combination of topic segments
 * after the `transfer` function name as we use a double wildcard (`**`).
 *
 * In this example, we load the SACEvents helper, which contains
 * predefined event structures for the SAC (Stellar Asset Contract),
 * including the `TransferEvent` type we use here.
 *
 * With this helper, we can easily create the topic filter
 * for the `transfer` event using the `toTopicFilter` method.
 *
 * By not providing any additional conditions to the `toTopicFilter` method,
 * we indicate we want to capture all `transfer` events regardless
 * of their parameters.
 *
 * If needed, we could provide specific parameter values to filter
 * only a subset of the `transfer` events, such as those transferring a specific asset
 * or to a specific recipient.
 */
const filter = new EventFilter({
  contractIds: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"], // XLM Contract ID in Mainnet
  type: EventType.Contract,
  topics: [SACEvents.TransferEvent.toTopicFilter()],
});

/**
 * Ingest five ledgers, including the latest one. Both bounds are inclusive,
 * so the stop ledger is four sequence numbers after the start.
 */
const server = new Server(networkConfig.rpcUrl);
const latestLedger = await server.getLatestLedger();
const stopLedger = latestLedger.sequence + 4;

console.log(
  `Latest ledger is ${
    chalk.green(
      latestLedger.sequence,
    )
  }, will stop ingestion at ledger ${chalk.green(stopLedger)}`,
);

/**
 * Now we can create the RPCStreamer instance (event variant)
 * with our filter and network configuration.
 *
 * We also set options to control the polling
 * interval for new ledgers and the paging
 * interval when fetching multiple events
 * from a single ledger.
 */
const eventStreamer = RPCStreamer.event({
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
const onEvent = (event: Event) => {
  // We can use the SACEvents helper to parse the raw event
  // into a structured TransferEvent instance. This gives us
  // easy access to the event parameters as well as
  // type-checking and validation.
  const transferEvent = SACEvents.TransferEvent.fromEvent(event);

  // Here we simply log the event details to the console
  console.log(`\nEvent received with id: ${chalk.green(transferEvent.id)}`);
  console.log(`  > Ledger ${chalk.green(transferEvent.ledger)}`);
  console.log(`  > Transaction ${chalk.green(transferEvent.txHash)}`);
  console.log(`  > From ${chalk.green(transferEvent.from)}`);
  console.log(`  > To ${chalk.green(transferEvent.to)}`);
  console.log(`  > Amount ${chalk.green(transferEvent.amount)}`);
  console.log(`  > Asset ${chalk.green(transferEvent.asset)}`);

  // Since CAP67, SAC transfer events can include optional
  // Muxed Account IDs for `to` field when the recipient
  // is a muxed account.
  //
  // We can check if these are present and log them as well.
  if (transferEvent.hasMuxedId()) {
    console.log(`  > To Muxed ID ${chalk.green(transferEvent.toMuxedId)}`);
  }

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
 * Provide the exact start we observed above, so another ledger closing during
 * setup does not shorten our five-ledger slice. startLive explicitly chooses
 * the normal RPC and fails if the requested start has left its retention window.
 * Use start() when you want the archive-to-live routing demonstrated separately.
 */
console.log(`Starting live ingestion...`);
await eventStreamer.startLive(onEvent, {
  startLedger: latestLedger.sequence,
  stopLedger,
});

console.log(`\nIngestion completed. Processed ${chalk.green(counter)} events.`);
Deno.exit(0);
