/**
 * Record confirmed Classic transactions built from native Stellar operations.
 *
 * Unlike the Soroban lesson, Classic transactions have no contract simulation
 * budget. Their evidence includes operation types, signing/submission stages,
 * ledger outcomes, and the actual fee charged. Each test builds its own operation
 * list and fetches the current source sequence through Colibri's real RPC pipeline.
 * Run with any test:* task in this directory; all submissions use Testnet.
 *
 * @module
 */
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { assert, assertEquals } from "@std/assert";
import { Asset, Operation } from "stellar-sdk";
import { recorder } from "../recording.ts";

const { describe, it, beforeAll, afterAll, observer } = recorder.recordTests(
  import.meta.url,
);
const networkConfig = NetworkConfig.TestNet();
const sender = LocalSigner.generateRandom();
const config: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: "100",
  timeout: 60,
};

// attach() instruments an existing callable pipeline and returns it unchanged.
// Standalone pipelines need network metadata for their report labels; this does
// not configure the RPC connection, which is set in the factory itself.
const sendTransaction = createClassicTransactionPipeline({ networkConfig });
observer.attach(sendTransaction, {
  name: "Testnet Classic transactions",
  network: networkConfig,
});

describe("Testnet Classic recording", () => {
  beforeAll(async () => {
    // Each file owns its setup, so either file can run by itself. Wait until the
    // funded source is visible to RPC before building its first transaction.
    await initializeWithFriendbot(
      networkConfig.friendbotUrl,
      sender.publicKey(),
      {
        rpcUrl: networkConfig.rpcUrl,
        allowHttp: networkConfig.allowHttp,
      },
    );
    observer.log("Funded Classic transaction source", {
      account: sender.publicKey(),
    });
  });

  afterAll(() => {
    sender.destroy();
  });

  it("records account creation and a payment in one transaction", async () => {
    // This recipient starts unfunded. The first operation creates the account;
    // the next pays it in the same atomic transaction. No earlier test is needed.
    using recipient = LocalSigner.generateRandom();
    const result = await observer.capture(
      () =>
        sendTransaction({
          operations: [
            Operation.createAccount({
              destination: recipient.publicKey(),
              startingBalance: "2",
            }),
            Operation.payment({
              destination: recipient.publicKey(),
              asset: Asset.native(),
              amount: "1",
            }),
          ],
          config,
        }),
      { name: "Create and pay a Testnet account" },
    );

    // Native operation outcomes retain their order. A confirmed successful
    // transaction applies both operations; its fee is separate from the 3 XLM sent.
    assertEquals(result.operations.map((operation) => operation.type), [
      "createAccount",
      "payment",
    ]);
    assert(result.feeCharged > 0n);
    observer.log("Confirmed two-operation transaction", {
      hash: result.hash,
      ledger: result.ledger,
      feeCharged: result.feeCharged,
    });
  });

  it("records a manage-data operation with a different operation profile", async () => {
    // Account data is a Classic ledger entry, not contract storage. This uses
    // only the funded source, independent of the other test's recipient.
    const result = await sendTransaction({
      operations: [
        Operation.manageData({ name: "recorder-example", value: "testnet" }),
      ],
      config,
    });

    // The attached pipeline already captures this call's execution. capture()
    // is optional; use it when the exact caller return value is useful evidence.
    const operation = result.operations[0];
    assertEquals(operation.type, "manageData");
    assertEquals(operation.result.type, "manageDataSuccess");
    assert(result.feeCharged > 0n);
  });
});
