/**
 * Shared evidence settings for the real Testnet lessons in tests/.
 *
 * Each Deno test worker imports its own recorder. The CLI gives those workers a
 * common run ID, merges their journals, and adds the native runner's results.
 * Output is deliberately absent here: test:silent records without retaining
 * artifacts or printing a recorder summary. Deno still prints its test results.
 * The output/ configurations reuse these capture settings for other modes.
 *
 * @module
 */
import { TestRecorder } from "@colibri/test-tooling/recorder/deno";

// Trace includes pipeline stages. Full events and authorization explain what
// happened, while timings, simulated budgets, and confirmed fees add profiling.
// Signatures are not needed to understand these lessons and stay excluded.
export const recorder = new TestRecorder({
  capture: "trace",
  events: "full",
  authorization: { level: "full", signatures: false },
  profiling: { timings: true, resources: true, fees: true },
});
