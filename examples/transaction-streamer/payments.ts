import { NetworkConfig } from "@colibri/core";
import { RPCStreamer } from "@colibri/rpc-streamer";
import { Server } from "stellar-sdk/rpc";

// The operation stream preserves the Stellar SDK's discriminated operation.
// Filter success first: an operation in a failed transaction is only intent.
const networkConfig = NetworkConfig.TestNet();
const latest = await new Server(networkConfig.rpcUrl).getLatestLedger();
const payments = RPCStreamer.operation({ networkConfig });
let count = 0;
await payments.startLive((item) => {
  if (item.transactionStatus !== "success") return;
  if (item.operation.type !== "payment") return;
  console.log({
    ledger: item.ledgerSequence,
    transaction: item.transactionHash,
    operationIndex: item.operationIndex,
    destination: item.operation.destination,
    amount: item.operation.amount,
    asset: item.operation.asset.toString(),
  });
  count++;
}, { startLedger: latest.sequence, stopLedger: latest.sequence + 4 });
console.log("Native payment operations in the slice:", count);
// This narrow lesson does not count path payments or Soroban token transfers.
// Callbacks may replay after interruption; durable consumers need idempotency.
