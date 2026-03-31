/**
 * Attaches to the running reusable ledger and submits a few example
 * transactions through Colibri.
 *
 * The script highlights the usual local development flow:
 * 1. Attach to an already-running named ledger
 * 2. Build a Colibri `NetworkConfig` from the exposed service URLs
 * 3. Initialize fresh accounts with Friendbot
 * 4. Use the RPC-backed classic transaction pipeline to send transactions
 *
 * Run with: deno task ledger:transactions
 */
import { createClassicTransactionPipeline, NetworkConfig } from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import {
  completeStreamingLogCommand,
  createContainerLog,
  createReusableLedger,
  followReusableLedgerLogs,
  initializeAccount,
  logsRequested,
  printReusableLedgerLinks,
} from "./shared.ts";

const streamingLogs = logsRequested();
const scope = streamingLogs ? "ledger:transactions:log" : "ledger:transactions";
const containerLog = createContainerLog(scope);
const ledger = createReusableLedger({ useRunningLedger: true });

containerLog("Attaching to the running reusable ledger container...");
await ledger.start();

if (streamingLogs) {
  containerLog(
    "Streaming recent container logs while the sample transactions run...",
  );
  await followReusableLedgerLogs(ledger, containerLog);
}

const details = await ledger.getNetworkDetails();
const networkConfig = NetworkConfig.CustomNet(details);

printReusableLedgerLinks(details, containerLog);
containerLog(
  "Building the classic transaction pipeline. Colibri will use the reusable ledger RPC endpoint for transaction submission.",
);
const classicPipeline = createClassicTransactionPipeline({ networkConfig });

const sender = await initializeAccount(
  networkConfig,
  "reusable sender",
  containerLog,
);
const receiver = await initializeAccount(
  networkConfig,
  "reusable receiver",
  containerLog,
);

containerLog(
  "Sending a payment transaction from the sender to the receiver...",
);
const paymentOne = await classicPipeline.run({
  operations: [
    Operation.payment({
      destination: receiver.publicKey(),
      asset: Asset.native(),
      amount: "25",
    }),
  ],
  config: {
    source: sender.publicKey(),
    fee: "100",
    timeout: 30,
    signers: [sender],
  },
});
containerLog(`Payment one confirmed with hash ${paymentOne.hash}.`);

containerLog("Sending a second payment back to the sender...");
const paymentTwo = await classicPipeline.run({
  operations: [
    Operation.payment({
      source: receiver.publicKey(),
      destination: sender.publicKey(),
      asset: Asset.native(),
      amount: "5",
    }),
  ],
  config: {
    source: receiver.publicKey(),
    fee: "100",
    timeout: 30,
    signers: [receiver],
  },
});
containerLog(`Payment two confirmed with hash ${paymentTwo.hash}.`);

containerLog(
  "Sending a setOptions transaction to update the receiver account...",
);
const setOptions = await classicPipeline.run({
  operations: [
    Operation.setOptions({
      source: receiver.publicKey(),
      homeDomain: "colibri.test",
    }),
  ],
  config: {
    source: receiver.publicKey(),
    fee: "100",
    timeout: 30,
    signers: [receiver],
  },
});
containerLog(`setOptions confirmed with hash ${setOptions.hash}.`);
containerLog(
  "Open the transactions explorer to inspect the submitted transactions in the browser:",
);
containerLog(details.transactionsExplorerUrl);

if (streamingLogs) {
  await completeStreamingLogCommand(
    containerLog,
    "Transaction logs complete. This command is exiting now, and the reusable ledger container is still running.",
  );
}
