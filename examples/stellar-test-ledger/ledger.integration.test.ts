/**
 * This subproject intentionally teaches TESTING. The other lessons are runnable
 * examples, not test suites. Docker must be running before starting this file.
 */
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
} from "@colibri/core";
import { QuickstartImageTags, StellarTestLedger } from "@colibri/test-tooling";
import { Asset, Operation } from "stellar-sdk";

// Keep the actual test-tooling API visible. A unique name avoids colliding with
// the optional long-lived ledger managed by the other files in this directory.
const ledger = new StellarTestLedger({
  containerName: `colibri-example-test-${crypto.randomUUID().slice(0, 8)}`,
  containerImageVersion: QuickstartImageTags.LATEST,
  logLevel: "warn",
});
let networkConfig: NetworkConfig;
let sendTransaction: ReturnType<typeof createClassicTransactionPipeline>;

describe({
  name: "A disposable local ledger",
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  /**
   * Start one disposable ledger for this suite and construct its network
   * client only after startup. Each test creates fresh accounts, so it does
   * not depend on balances or settings from the other test.
   */
  beforeAll(async () => {
    await ledger.start();

    // Use the running container's URLs AND passphrase, never Testnet defaults.
    const networkDetails = await ledger.getNetworkDetails();

    networkConfig = NetworkConfig.CustomNet(networkDetails);
    sendTransaction = createClassicTransactionPipeline({ networkConfig });
  });

  afterAll(async () => {
    // Cleanup is important even when an assertion or transaction fails.
    try {
      await ledger.stop();
    } finally {
      await ledger.destroy();
    }
  });

  it("confirms an XLM payment through Colibri", async () => {
    using sender = LocalSigner.generateRandom();
    using receiver = LocalSigner.generateRandom();

    for (const signer of [sender, receiver]) {
      await initializeWithFriendbot(
        networkConfig.friendbotUrl!,
        signer.publicKey(),
        {
          rpcUrl: networkConfig.rpcUrl,
          allowHttp: networkConfig.allowHttp,
        },
      );
    }

    /**
     * Submit a 25-XLM native payment through the actual Colibri pipeline.
     * Assert the confirmed status, operation type and ledger instead of
     * treating a returned hash alone as proof of successful execution.
     */
    const paid = await sendTransaction({
      operations: [
        Operation.payment({
          destination: receiver.publicKey(),
          asset: Asset.native(),
          amount: "25",
        }),
      ],
      config: {
        source: sender.publicKey(),
        signers: [sender],
        fee: { base: "100" },
        timeout: 60,
      },
    });

    assertEquals(paid.response.status, "SUCCESS");
    assertEquals(paid.response.txHash, paid.hash);
    assertEquals(paid.operations[0].type, "payment");
    assertExists(paid.ledger);
  });

  it("reuses that ledger for a separate account-settings transaction", async () => {
    using account = LocalSigner.generateRandom();

    await initializeWithFriendbot(
      networkConfig.friendbotUrl!,
      account.publicKey(),
      {
        rpcUrl: networkConfig.rpcUrl,
        allowHttp: networkConfig.allowHttp,
      },
    );

    /**
     * Use a separate account to show the same pipeline can change account
     * settings. This checks the operation result independently of the
     * payment test above.
     */
    const updated = await sendTransaction({
      operations: [Operation.setOptions({ homeDomain: "colibri.test" })],
      config: {
        source: account.publicKey(),
        signers: [account],
        fee: "100",
        timeout: 60,
      },
    });

    assertEquals(updated.response.status, "SUCCESS");
    assertEquals(updated.operations[0].type, "setOptions");
  });
});
