/**
 * Example: Stellar Test Ledger integration tests powered by
 * @colibri/test-tooling
 *
 * The suite starts a Stellar Quickstart container, derives a local Colibri
 * network configuration from it, runs a few transaction-focused test steps
 * through Colibri, and then stops and destroys the container.
 *
 * Run with: deno task test
 */
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { createClassicTransactionPipeline, NetworkConfig } from "@colibri/core";
import { Asset, Operation } from "stellar-sdk";
import {
  createContainerLog,
  createIntegrationTestLedger,
  initializeAccount,
} from "./shared.ts";

/**
 * Writes the container lifecycle messages requested for the educational
 * example.
 */
const containerLog = createContainerLog("test");

/**
 * Shared integration test state populated during `beforeAll`.
 */
let networkConfig: NetworkConfig;
let classicPipeline: ReturnType<typeof createClassicTransactionPipeline>;

describe(
  {
    name: "StellarTestLedger example",
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    /**
     * The example uses a fixed ledger name so it matches the main tool name we
     * are showcasing and mirrors the package default.
     */
    const stellarTestLedger = createIntegrationTestLedger();

    /**
     * Start the Docker-backed ledger once for the whole suite and prepare the
     * Colibri pipeline that the individual test cases will reuse.
     */
    beforeAll(async () => {
      containerLog("Starting Docker-backed Stellar Test Ledger container...");
      await stellarTestLedger.start();

      const networkDetails = await stellarTestLedger.getNetworkDetails();
      assertExists(networkDetails.rpcUrl);
      networkConfig = NetworkConfig.CustomNet(networkDetails);

      /**
       * Build the classic transaction pipeline.
       *
       * The pipeline uses the local ledger's Soroban RPC endpoint under the
       * hood to build, submit, and wait for each transaction.
       */
      classicPipeline = createClassicTransactionPipeline({ networkConfig });

      containerLog("Container is ready. Running Colibri transaction tests...");
    });

    /**
     * Always stop and destroy the container after the suite completes so local
     * Docker state is left clean for the next run.
     */
    afterAll(async () => {
      containerLog("Stopping Stellar Test Ledger container...");
      await stellarTestLedger.stop();
      await stellarTestLedger.destroy();
      containerLog("Container stopped and destroyed.");
    });

    describe("Transactions", () => {
      it("submits a classic payment on the local ledger", async () => {
        /**
         * Create two fresh accounts for this test. The helper uses Friendbot to
         * fund them and waits until the local RPC can see the new accounts.
         */
        const sender = await initializeAccount(
          networkConfig,
          "test payment sender",
          containerLog,
        );
        const receiver = await initializeAccount(
          networkConfig,
          "test payment receiver",
          containerLog,
        );

        /**
         * Submit a plain classic payment operation through Colibri's
         * RPC-backed classic transaction pipeline.
         */
        const payment = await classicPipeline.run({
          operations: [
            Operation.payment({
              destination: receiver.publicKey(),
              asset: Asset.native(),
              amount: "25",
            }),
          ],
          config: {
            source: sender.publicKey(),
            fee: "100",
            timeout: 30,
            signers: [sender],
          },
        });

        /**
         * Assert against Colibri's own transaction output: the transaction hash,
         * final status, and the ledger where it landed.
         */
        assertExists(payment.hash);
        assertEquals(payment.response.txHash, payment.hash);
        assertEquals(payment.response.status, "SUCCESS");
        assertExists(payment.response.ledger);
      });

      it("submits a classic setOptions transaction on the same ledger", async () => {
        const account = await initializeAccount(
          networkConfig,
          "test settings account",
          containerLog,
        );
        const homeDomain = "colibri.test";

        /**
         * This second test uses a different classic operation to show that the
         * same running test ledger can support multiple RPC-backed transaction
         * cases in a single test session.
         */
        const update = await classicPipeline.run({
          operations: [
            Operation.setOptions({
              source: account.publicKey(),
              homeDomain,
            }),
          ],
          config: {
            source: account.publicKey(),
            fee: "100",
            timeout: 30,
            signers: [account],
          },
        });

        assertExists(update.hash);
        assertEquals(update.response.txHash, update.hash);
        assertEquals(update.response.status, "SUCCESS");
        assertExists(update.response.ledger);
      });
    });
  },
);
