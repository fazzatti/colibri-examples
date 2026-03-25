/**
 * Starts a reusable local Stellar Test Ledger container.
 *
 * This variation is useful when you want a long-lived local Quickstart
 * container for exploration. It enables Lab and the embedded transaction
 * explorer, waits for the ledger to be ready, and then prints the URLs you can
 * visit in the browser.
 *
 * Run with: deno task ledger:start
 */
import {
  completeStreamingLogCommand,
  createContainerLog,
  createLedgerLogger,
  createReusableLedger,
  logsRequested,
  printReusableLedgerLinks,
  reusableLogLevel,
} from "./shared.ts";

const streamingLogs = logsRequested();
const scope = streamingLogs ? "ledger:start:log" : "ledger:start";
const containerLog = createContainerLog(scope);
const ledger = createReusableLedger({
  emitContainerLogs: streamingLogs,
  logger: streamingLogs ? createLedgerLogger(scope) : undefined,
  logLevel: streamingLogs ? reusableLogLevel() : undefined,
});

if (streamingLogs) {
  containerLog(
    "Streaming container startup logs until the reusable ledger is ready...",
  );
}

containerLog(
  "Starting the reusable Stellar Test Ledger container...",
);
await ledger.start();

const details = await ledger.getNetworkDetails();
containerLog(
  "Container is ready and will stay running after this script exits.",
);
printReusableLedgerLinks(details, containerLog);
containerLog(
  "Use `deno task ledger:transactions` to submit sample transactions.",
);
containerLog(
  "Use `deno task ledger:restart` or `deno task ledger:stop` to manage the running container.",
);

if (streamingLogs) {
  await completeStreamingLogCommand(
    containerLog,
    "Startup logs complete. This command is exiting now, and the reusable ledger container will keep running in the background.",
  );
}
