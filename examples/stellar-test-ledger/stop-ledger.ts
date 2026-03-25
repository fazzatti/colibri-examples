/**
 * Stops the reusable ledger container.
 *
 * `useRunningLedger` is intentionally non-owning, so `StellarTestLedger#stop()`
 * becomes a no-op for attached ledgers. This script shows the companion
 * pattern: attach to the named running ledger, grab the Docker container with
 * `getContainer()`, and then issue the stop directly on that container.
 *
 * Run with: deno task ledger:stop
 */
import {
  completeStreamingLogCommand,
  createContainerLog,
  createReusableLedger,
  followReusableLedgerLogs,
  logsRequested,
} from "./shared.ts";

const streamingLogs = logsRequested();
const scope = streamingLogs ? "ledger:stop:log" : "ledger:stop";
const containerLog = createContainerLog(scope);
const ledger = createReusableLedger({ useRunningLedger: true });

containerLog("Attaching to the running reusable ledger container...");
await ledger.start();

if (streamingLogs) {
  containerLog(
    "Streaming recent container logs while the reusable ledger shuts down...",
  );
  await followReusableLedgerLogs(ledger, containerLog);
}

containerLog("Stopping the running container...");
await ledger.getContainer().stop();
containerLog("Container stopped.");

if (streamingLogs) {
  await completeStreamingLogCommand(
    containerLog,
    "Shutdown logs complete. This command is exiting now because the reusable ledger container has been stopped.",
  );
}
