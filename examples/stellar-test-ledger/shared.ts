/**
 * Shared helpers for the Stellar Test Ledger example.
 *
 * The integration test and the runnable scripts all use the same small set of
 * helpers so the example stays consistent while still being easy to read.
 */
import { assertExists } from "@std/assert";
import {
  initializeWithFriendbot,
  LocalSigner,
  type NetworkConfig,
} from "@colibri/core";
import {
  type LoggerLike,
  type LogLevelDesc,
  QuickstartImageTags,
  QuickstartServices,
  StellarTestLedger,
} from "@colibri/test-tooling";

/**
 * Fixed container name used by the isolated integration test.
 */
export const TEST_LEDGER_NAME = "colibri-stellar-test-ledger";

/**
 * Fixed container name used by the long-lived reusable ledger tasks.
 */
export const REUSABLE_LEDGER_NAME = "colibri-stellar-test-ledger-reusable";

/**
 * Service tuple used by the reusable ledger scripts.
 *
 * Besides Horizon, RPC, and Friendbot, it enables Stellar Lab, the embedded
 * transaction explorer, and local ledger meta output.
 */
export const REUSABLE_LEDGER_ENABLED_SERVICES = [
  QuickstartServices.CORE,
  QuickstartServices.HORIZON,
  QuickstartServices.RPC,
  QuickstartServices.LAB,
  QuickstartServices.GALEXIE,
] as const;

const DEFAULT_LOG_LEVEL = "warn" as const;
const STREAMING_LOG_LEVEL = "debug" as const;
const DOCKER_LOG_HEADER_LENGTH = 8;

/**
 * Creates a small namespaced logger for the example scripts.
 *
 * @param scope - Short label describing the current example flow.
 * @returns A logger function that prefixes messages consistently.
 */
export const createContainerLog = (scope: string) => {
  return (message: string): void => {
    console.log(`[stellar-test-ledger:${scope}] ${message}`);
  };
};

/**
 * Creates a logger compatible with `StellarTestLedger`.
 *
 * This is used by the `:log` task variants so both lifecycle messages and the
 * forwarded container logs show up with the same example prefix.
 */
export const createLedgerLogger = (scope: string): LoggerLike => {
  const prefix = `[stellar-test-ledger:${scope}]`;

  return {
    error: (...msg: unknown[]) => console.error(prefix, ...msg),
    warn: (...msg: unknown[]) => console.warn(prefix, ...msg),
    info: (...msg: unknown[]) => console.info(prefix, ...msg),
    debug: (...msg: unknown[]) => console.debug(prefix, ...msg),
    trace: (...msg: unknown[]) => console.debug(prefix, ...msg),
  };
};

type ReusableLedgerOptions = {
  useRunningLedger?: boolean;
  emitContainerLogs?: boolean;
  logger?: LoggerLike;
  logLevel?: LogLevelDesc;
};

/**
 * Creates the ephemeral ledger used by the automated integration test.
 *
 * `LATEST` comes from `QuickstartImageTags`, but any valid Quickstart Docker
 * tag string would also be accepted here.
 */
export const createIntegrationTestLedger = () => {
  return new StellarTestLedger({
    containerName: TEST_LEDGER_NAME,
    containerImageVersion: QuickstartImageTags.LATEST,
    logLevel: DEFAULT_LOG_LEVEL,
  });
};

/**
 * Creates the reusable local ledger used by the operational tasks.
 *
 * Set `useRunningLedger` when the caller wants to attach to an already-running
 * named container instead of creating a fresh one.
 */
export const createReusableLedger = ({
  useRunningLedger = false,
  emitContainerLogs = false,
  logger,
  logLevel = DEFAULT_LOG_LEVEL,
}: ReusableLedgerOptions = {}) => {
  return new StellarTestLedger({
    containerName: REUSABLE_LEDGER_NAME,
    containerImageVersion: QuickstartImageTags.LATEST,
    enabledServices: REUSABLE_LEDGER_ENABLED_SERVICES,
    emitContainerLogs,
    logger,
    logLevel,
    useRunningLedger,
  });
};

/**
 * Narrow network-details shape returned by the reusable ledger.
 */
export type ReusableLedgerNetworkDetails = Awaited<
  ReturnType<ReturnType<typeof createReusableLedger>["getNetworkDetails"]>
>;

/**
 * Minimal reusable-ledger shape needed to access the Docker container.
 *
 * This keeps helper typing aligned with the reusable ledger configuration,
 * including the extra services enabled for Lab and Galexie.
 */
type ReusableLedgerContainerAccess = Pick<
  ReturnType<typeof createReusableLedger>,
  "getContainer"
>;

/**
 * Funds a new signer with Friendbot and waits until the account is visible on
 * the local RPC endpoint.
 *
 * This helper is intentionally explicit in the logs so readers can see when
 * accounts are being initialized before transactions are sent.
 *
 * @param networkConfig - Local Colibri network config built from the test ledger.
 * @param label - Human-readable account name used in log output.
 * @param containerLog - Example logger for lifecycle output.
 * @returns A funded signer ready to sign classic transactions.
 */
export const initializeAccount = async (
  networkConfig: NetworkConfig,
  label: string,
  containerLog: (message: string) => void,
): Promise<LocalSigner> => {
  const signer = LocalSigner.generateRandom();
  assertExists(networkConfig.friendbotUrl);
  assertExists(networkConfig.rpcUrl);

  containerLog(
    `Initializing ${label} with Friendbot so it can be used in transactions...`,
  );

  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );

  containerLog(`${label} is ready on the local ledger: ${signer.publicKey()}`);
  return signer;
};

/**
 * Prints the service URLs exposed by the reusable ledger.
 *
 * These URLs make it easy to jump directly into Horizon, Friendbot, RPC,
 * Stellar Lab, the transaction explorer, and the local ledger meta endpoint.
 */
export const printReusableLedgerLinks = (
  details: ReusableLedgerNetworkDetails,
  containerLog: (message: string) => void,
): void => {
  containerLog(`Horizon: ${details.horizonUrl}`);
  containerLog(`RPC: ${details.rpcUrl}`);
  containerLog(`Friendbot: ${details.friendbotUrl}`);
  containerLog(`Stellar Lab: ${details.labUrl}`);
  containerLog(`Transactions Explorer: ${details.transactionsExplorerUrl}`);
  containerLog(`Ledger Meta: ${details.ledgerMetaUrl}`);
};

/**
 * Resolves whether the current script was asked to stream container logs.
 */
export const logsRequested = (): boolean => Deno.args.includes("--logs");

/**
 * Log level used by the reusable ledger `:log` variants.
 */
export const reusableLogLevel = (): LogLevelDesc => STREAMING_LOG_LEVEL;

/**
 * Ends a one-shot `:log` command after its last user-facing output has been
 * written.
 *
 * Docker's follow-log stream is long-lived by design, so the example log
 * variants exit the process explicitly once their main action is complete.
 */
export const completeStreamingLogCommand = async (
  containerLog: (message: string) => void,
  message: string,
): Promise<never> => {
  containerLog(message);
  await new Promise((resolve) => setTimeout(resolve, 100));
  Deno.exit(0);
};

/**
 * Decodes Docker's multiplexed stdout/stderr log stream format.
 */
const createDockerLogDecoder = () => {
  const textDecoder = new TextDecoder();
  let buffer = new Uint8Array(0);
  let readOffset = 0;
  let writeOffset = 0;

  const reset = () => {
    buffer = new Uint8Array(0);
    readOffset = 0;
    writeOffset = 0;
  };

  const ensureCapacity = (additional: number) => {
    if (buffer.length - writeOffset >= additional) {
      return;
    }

    const unreadLength = writeOffset - readOffset;
    if (readOffset > 0 && (buffer.length - unreadLength) >= additional) {
      buffer.copyWithin(0, readOffset, writeOffset);
      writeOffset = unreadLength;
      readOffset = 0;
      return;
    }

    let capacity = Math.max(8192, buffer.length);
    while ((capacity - unreadLength) < additional) {
      capacity *= 2;
    }

    const nextBuffer = new Uint8Array(capacity);
    if (unreadLength > 0) {
      nextBuffer.set(buffer.subarray(readOffset, writeOffset));
    }

    buffer = nextBuffer;
    readOffset = 0;
    writeOffset = unreadLength;
  };

  const appendChunk = (chunk: Uint8Array) => {
    if (chunk.length === 0) {
      return;
    }

    ensureCapacity(chunk.length);
    buffer.set(chunk, writeOffset);
    writeOffset += chunk.length;
  };

  const decodeChunk = (chunk: Uint8Array | string): string[] => {
    if (typeof chunk === "string") {
      return [chunk];
    }

    appendChunk(chunk);
    const messages: string[] = [];

    while (writeOffset > readOffset) {
      const available = writeOffset - readOffset;
      if (available < DOCKER_LOG_HEADER_LENGTH) {
        break;
      }

      const streamType = buffer[readOffset];
      const isHeader = (streamType === 1 || streamType === 2) &&
        buffer[readOffset + 1] === 0 &&
        buffer[readOffset + 2] === 0 &&
        buffer[readOffset + 3] === 0;

      if (!isHeader) {
        messages.push(
          textDecoder.decode(buffer.subarray(readOffset, writeOffset)),
        );
        reset();
        break;
      }

      const payloadLength = ((buffer[readOffset + 4] << 24) |
        (buffer[readOffset + 5] << 16) |
        (buffer[readOffset + 6] << 8) |
        buffer[readOffset + 7]) >>> 0;
      const frameLength = DOCKER_LOG_HEADER_LENGTH + payloadLength;

      if (available < frameLength) {
        break;
      }

      const start = readOffset + DOCKER_LOG_HEADER_LENGTH;
      const end = start + payloadLength;
      messages.push(textDecoder.decode(buffer.subarray(start, end)));
      readOffset += frameLength;
    }

    if (readOffset === writeOffset) {
      reset();
    }

    return messages;
  };

  const flush = (): string => {
    if (writeOffset <= readOffset) {
      reset();
      return "";
    }

    const output = textDecoder.decode(buffer.subarray(readOffset, writeOffset));
    reset();
    return output;
  };

  return { decodeChunk, flush };
};

const formatContainerLogLine = (message: string): string[] => {
  return message
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
};

/**
 * Follows the logs for an already-running reusable ledger while the current
 * script performs its work.
 *
 * This is used by the attach-based `:log` variants because `emitContainerLogs`
 * only auto-attaches when the current `StellarTestLedger` instance creates the
 * container itself.
 */
export const followReusableLedgerLogs = async (
  ledger: ReusableLedgerContainerAccess,
  containerLog: (message: string) => void,
): Promise<() => void> => {
  const logStream = await ledger.getContainer().logs({
    follow: true,
    since: Math.max(0, Math.floor(Date.now() / 1000) - 1),
    stderr: true,
    stdout: true,
  }) as NodeJS.ReadableStream & {
    destroy?: (error?: Error) => void;
    off?: (event: string, listener: (...args: unknown[]) => void) => void;
    removeListener?: (
      event: string,
      listener: (...args: unknown[]) => void,
    ) => void;
  };
  const decoder = createDockerLogDecoder();
  let closing = false;

  const logDecodedMessage = (message?: string) => {
    if (!message) {
      return;
    }

    for (const line of formatContainerLogLine(message)) {
      containerLog(`[container] ${line}`);
    }
  };

  const onData = (chunk: Uint8Array | string) => {
    for (const message of decoder.decodeChunk(chunk)) {
      logDecodedMessage(message);
    }
  };
  const onEnd = () => {
    logDecodedMessage(decoder.flush());
  };
  const onError = (error: unknown) => {
    if (
      closing &&
      error instanceof Error &&
      (error.name === "Interrupted" ||
        error.message.includes("operation canceled"))
    ) {
      return;
    }

    logDecodedMessage(decoder.flush());
    const message = error instanceof Error ? error.message : String(error);
    containerLog(`[container] Log stream error: ${message}`);
  };

  logStream.on("data", onData);
  logStream.on("end", onEnd);
  logStream.on("error", onError);

  return () => {
    closing = true;
    logDecodedMessage(decoder.flush());
    logStream.destroy?.();
  };
};
