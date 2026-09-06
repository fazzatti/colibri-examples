import { NetworkConfig } from "@colibri/core";
import { RPCStreamer } from "@colibri/rpc-streamer";
import { Server } from "stellar-sdk/rpc";

// Read a bounded five-ledger slice beginning at the latest available ledger.
// This uses RPC ledger data, not Horizon and not a market indexer.
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl);
const latest = await rpc.getLatestLedger();
const transactions = RPCStreamer.transaction({ networkConfig });
let count = 0;
await transactions.startLive((item) => {
  // Failed transactions are records too. Print the status instead of
  // presenting every transaction as successfully executed.
  console.log(
    item.ledgerSequence,
    item.transactionHash,
    item.transactionStatus,
  );
  count++;
}, { startLedger: latest.sequence, stopLedger: latest.sequence + 4 });
console.log("Finished the bounded slice. Transactions observed:", count);
// No matching transactions is a legitimate result on a quiet network.
