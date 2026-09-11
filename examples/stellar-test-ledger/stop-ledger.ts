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

/**
 * The optional --logs flag changes terminal output, not the ledger workflow.
 * The shared helpers keep Docker log forwarding and the reusable container
 * name consistent across these lifecycle commands.
 */
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

/**
 * This ledger object is attached rather than owning the container, so use
 * the exposed Docker handle to stop it explicitly. Stopping leaves the
 * container present; it is not the destroy step used by the disposable test.
 */
await ledger.getContainer().stop();

containerLog("Container stopped.");

if (streamingLogs) {
  await completeStreamingLogCommand(
    containerLog,
    "Shutdown logs complete. This command is exiting now because the reusable ledger container has been stopped.",
  );
}
