/**
 * Example: Transaction Ingestion
 *
 * Read a bounded five-ledger Testnet slice and inspect every transaction
 * status. This observer uses RPC only: it creates no accounts and submits no
 * transactions.
 *
 * Run: deno task transactions
 */
import { NetworkConfig } from "@colibri/core";
import { RPCStreamer } from "@colibri/rpc-streamer";
import { Server } from "stellar-sdk/rpc";

/**
 * Read a bounded five-ledger slice beginning at the latest available ledger.
 * This uses RPC ledger data, not Horizon and not a market indexer.
 */
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl);

const latest = await rpc.getLatestLedger();

/**
 * Select the transaction stream. Each callback will retain the ledger,
 * transaction hash and success/failure status so we can distinguish observed
 * transactions from successful execution.
 */
const transactions = RPCStreamer.transaction({ networkConfig });

// Both endpoints are inclusive, so this observes exactly five ledgers.
const ledgerRange = {
  startLedger: latest.sequence,
  stopLedger: latest.sequence + 4,
};

// No matching transactions is a legitimate result on a quiet network.
let count = 0;

/**
 * Start at the ledger observed above and await completion through the
 * inclusive stop ledger. The callback counts every transaction record; the
 * status it prints tells us whether that transaction succeeded. A quiet
 * slice can finish with zero records.
 */
await transactions.startLive((item) => {
  /**
   * Failed transactions are records too. Print the status instead of
   * presenting every transaction as successfully executed.
   */
  console.log(
    item.ledgerSequence,
    item.transactionHash,
    item.transactionStatus,
  );

  count++;
}, ledgerRange);

console.log("Finished the bounded slice. Transactions observed:", count);
