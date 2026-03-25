/**
 * Restarts the reusable ledger and waits for it to become ready
 * again.
 *
 * `useRunningLedger` lets the script attach to the existing named container.
 * Once attached, the script uses the exposed Docker container handle to issue
 * the restart and then re-attaches so `StellarTestLedger` can wait for all
 * enabled services to be healthy again.
 *
 * Run with: deno task ledger:restart
 */
import {
  completeStreamingLogCommand,
  createContainerLog,
  createReusableLedger,
  followReusableLedgerLogs,
  logsRequested,
  printReusableLedgerLinks,
} from "./shared.ts";

const streamingLogs = logsRequested();
const scope = streamingLogs ? "ledger:restart:log" : "ledger:restart";
const containerLog = createContainerLog(scope);

containerLog("Attaching to the running reusable ledger container...");
const attachedLedger = createReusableLedger({ useRunningLedger: true });
await attachedLedger.start();

if (streamingLogs) {
  containerLog(
    "Streaming container logs while the current reusable ledger instance shuts down...",
  );
  await followReusableLedgerLogs(attachedLedger, containerLog);
}

containerLog("Restarting the running container...");
await attachedLedger.getContainer().restart();

if (streamingLogs) {
  containerLog(
    "Streaming container logs while the restarted reusable ledger initializes...",
  );
  await followReusableLedgerLogs(attachedLedger, containerLog);
}

containerLog("Waiting for the restarted container to become ready again...");
const refreshedLedger = createReusableLedger({ useRunningLedger: true });
await refreshedLedger.start();

const details = await refreshedLedger.getNetworkDetails();
containerLog("Container restarted successfully.");
printReusableLedgerLinks(details, containerLog);

if (streamingLogs) {
  await completeStreamingLogCommand(
    containerLog,
    "Restart logs complete. This command is exiting now, and the reusable ledger container is still running.",
  );
}
