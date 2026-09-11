/**
 * Example: Payment Operation Ingestion
 *
 * Observe successful native payment operations in a five-ledger Testnet
 * slice. Transaction status and operation type determine which records
 * represent executed payments.
 *
 * Run: deno task payments
 */
import { NetworkConfig } from "@colibri/core";
import { RPCStreamer } from "@colibri/rpc-streamer";
import { Server } from "stellar-sdk/rpc";

/**
 * The operation stream preserves the Stellar SDK's discriminated operation.
 * Filter success first: an operation in a failed transaction is only intent.
 */
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl);

const latest = await rpc.getLatestLedger();

/**
 * Select the operation stream to inspect individual native SDK operations
 * inside transactions. We will first require a successful transaction, then
 * narrow the operation to payment before reading its fields.
 */
const payments = RPCStreamer.operation({ networkConfig });

// Both endpoints are inclusive, so this observes exactly five ledgers.
const ledgerRange = {
  startLedger: latest.sequence,
  stopLedger: latest.sequence + 4,
};
let count = 0;

/**
 * This narrow lesson does not count path payments or Soroban token
 * transfers. Callbacks may replay after interruption; durable consumers need
 * idempotency.
 */
await payments.startLive((item) => {
  if (item.transactionStatus !== "success") return;

  const operation = item.operation;

  if (operation.type !== "payment") return;

  console.log({
    ledger: item.ledgerSequence,
    transaction: item.transactionHash,
    operationIndex: item.operationIndex,
    destination: operation.destination,
    amount: operation.amount,
    asset: operation.asset.toString(),
  });

  count++;
}, ledgerRange);

console.log("Native payment operations in the slice:", count);
