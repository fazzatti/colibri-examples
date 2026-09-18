/**
 * Record real Soroban reads and a transfer through Testnet's native XLM SAC.
 *
 * A Stellar Asset Contract exposes Classic balances through a contract API.
 * balance() simulates a read; transfer() signs, submits, and waits for a ledger.
 * Attaching the recorder exposes both paths without replacing their RPC calls.
 * Each run creates and funds disposable accounts through the real Friendbot.
 * Run with any test:* task in this directory; no Docker or Wasm build is needed.
 *
 * @module
 */
import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
} from "@colibri/core";
import { assert, assertEquals } from "@std/assert";
import { recorder } from "../recording.ts";

// These BDD functions retain Deno's test semantics and attribute observations to
// the active test or setup hook. Assertions still come from the standard library.
const { describe, it, beforeAll, afterAll, observer } = recorder.recordTests(
  import.meta.url,
);
const networkConfig = NetworkConfig.TestNet();
const sender = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();

// create() observes construction and attaches to the SAC's underlying read and
// invoke pipelines. The returned value is the original client, with its API intact.
const XLM = observer.create(
  () => StellarAssetContract.NativeXLM(networkConfig),
  { name: "Testnet XLM contract" },
);

describe("Testnet contract recording", () => {
  beforeAll(async () => {
    // Passing rpcUrl waits until Friendbot funding is visible through the same
    // RPC used by the tests. Funding is real setup, never a fabricated response.
    for (const signer of [sender, recipient]) {
      await observer.capture(
        () =>
          initializeWithFriendbot(
            networkConfig.friendbotUrl,
            signer.publicKey(),
            {
              rpcUrl: networkConfig.rpcUrl,
              allowHttp: networkConfig.allowHttp,
            },
          ),
        { name: "Fund a disposable Testnet account" },
      );
    }

    // Explicit logs give the report useful public context. Never log a signer,
    // secret key, or signature: account addresses are all this lesson needs.
    observer.log("Funded contract lesson accounts", {
      sender: sender.publicKey(),
      recipient: recipient.publicKey(),
    });
  });

  afterAll(() => {
    // Destroy in-memory signing material even when an assertion fails. These
    // disposable Testnet accounts remain on the ledger until Testnet resets.
    sender.destroy();
    recipient.destroy();
  });

  it("records three balance simulations without submitting transactions", async () => {
    // Repetition supplies real profiling samples. Read timings include network
    // latency; simulation resources are budgets, not measured CPU consumption.
    for (let sample = 1; sample <= 3; sample++) {
      const balance = await observer.capture(
        () => XLM.balance({ id: recipient.publicKey() }),
        { name: "Read recipient balance", metadata: { sample } },
      );

      // capture() preserves the public method's bigint return value. The report
      // shows this caller result alongside the underlying read pipeline evidence.
      assert(balance > 0n);
    }
  });

  it("records a confirmed transfer and checks the recipient's balance", async () => {
    const balanceBefore = await XLM.balance({ id: recipient.publicKey() });
    const amount = 10_000_000n;

    // SAC amounts use integer stroops: 10,000,000 stroops is 1 XLM. The sender
    // signs and pays the fees; the recipient's exact delta can therefore be tested.
    const transfer = await observer.capture(
      () =>
        XLM.transfer({
          from: sender.publicKey(),
          to: recipient.publicKey(),
          amount,
          config: {
            source: sender.publicKey(),
            signers: [sender],
            fee: "100000",
            timeout: 60,
          },
        }),
      { name: "Transfer 1 XLM on Testnet" },
    );

    // This is a fresh RPC simulation after confirmation, not a cached balance.
    const balanceAfter = await XLM.balance({ id: recipient.publicKey() });
    assertEquals(balanceAfter - balanceBefore, amount);
    observer.log("Confirmed SAC transfer", { hash: transfer.hash, amount });
  });
});
