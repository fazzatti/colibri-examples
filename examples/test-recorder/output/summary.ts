/**
 * Print an aggregate console summary without retaining JSON or HTML.
 * Run: deno task test:summary
 *
 * The CLI loads this module to choose the run's output. The test files import
 * recording.ts for the same capture settings; the CLI supplies their shared
 * journal directory. Changing the output mode does not change the test logic.
 *
 * @module
 */
import { TestRecorder } from "@colibri/test-tooling/recorder/deno";
import { recorder as captureSettings } from "../recording.ts";

// Keep collection identical across modes so their evidence is comparable.
export const recorder = new TestRecorder({
  ...captureSettings.options,
  output: { summary: true },
});
