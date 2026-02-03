/**
 * Example: Handling Errors
 *
 * This example demonstrates how Colibri exposes deterministic, typed errors.
 * We intentionally trigger a known error and inspect its anatomy:
 * - `code` is unique and stable
 * - `domain` + `source` tell you where it came from
 * - `details` explains why it happened
 * - `meta` carries structured input data
 * - `diagnostic` provides root cause and suggestion
 *
 * Run with: deno task handling-errors
 */
import {
  BTX_ERRORS,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
} from "@colibri/core";
import chalk from "chalk";

console.log(chalk.blue.bold("\n⚠️  Handling Errors Example\n"));

/**
 * We start by selecting the TestNet preset configuration.
 * It includes the passphrase and RPC URL needed by Colibri clients.
 */
const networkConfig = NetworkConfig.TestNet();

/**
 * Generate two random keypairs to act as sender and receiver.
 * We don't need to fund them because the error happens before any RPC call.
 */
const sender = LocalSigner.generateRandom();
const receiver = LocalSigner.generateRandom();

console.log(chalk.gray("Sender:"), sender.publicKey());
console.log(chalk.gray("Receiver:"), receiver.publicKey());

/**
 * Create the SAC client for native XLM.
 * This gives us a high-level interface without manually calling processes.
 */
const XLM = StellarAssetContract.NativeXLM(networkConfig);

try {
  /**
   * Submit a transfer with an invalid base fee.
   * Base fee must be > 0, so this always fails in BuildTransaction.
   */
  await XLM.transfer({
    from: sender.publicKey(),
    to: receiver.publicKey(),
    amount: 1_0000000n, // 10 XLM in stroops
    config: {
      source: sender.publicKey(),
      fee: "0", // invalid
      signers: [sender],
      timeout: 30,
    },
  });
} catch (err) {
  /**
   * We expect a specific error class. Since error codes are unique,
   * narrowing with `instanceof` lets TypeScript infer the exact shape,
   * which is helpful when extracting metadata for handling.
   */
  if (err instanceof BTX_ERRORS.BASE_FEE_TOO_LOW_ERROR) {
    console.log(chalk.red("Matched BuildTransaction BASE_FEE_TOO_LOW"));

    console.log(chalk.blue.bold("\n🧩 Error Anatomy"));
    // Identity fields: stable, unique code + where it originated.
    // Codes are unique and stable,
    // which makes them safe to match on in logs or retry logic.
    console.log(chalk.gray("name:"), err.name);
    console.log(chalk.gray("code (unique):"), err.code);
    console.log(chalk.gray("domain:"), err.domain);
    console.log(chalk.gray("source:"), err.source);
    // Human-readable explanation for logs and UX.
    console.log(chalk.gray("message:"), err.message);
    console.log(chalk.gray("details:"), err.details);

    console.log(chalk.blue.bold("\n🧾 Metadata"));
    // Structured input that triggered the error (typed).
    // This is meant for programmatic handling (e.g., retries or fixes),
    // and is guaranteed to follow the error class' meta shape.
    console.log(chalk.gray("input.baseFee:"), err.meta.data.input.baseFee);
    console.log(chalk.gray("input.source:"), err.meta.data.input.source);
    // `meta.cause` is where Colibri stores the original error when it wraps
    // an external failure (RPC, network, SDK, etc.). That lets you inspect
    // the underlying cause without losing Colibri’s typed context.
    // Here it is undefined because this error is a pure Colibri validation
    // that happens before any external call is made.

    console.log(chalk.blue.bold("\n🩺 Diagnostic"));
    // Diagnostic guidance to help resolve the issue.
    // Colibri includes suggestions and references when available.
    const diagnostic = err.diagnostic!;
    console.log(chalk.gray("rootCause:"), diagnostic.rootCause);
    console.log(chalk.cyan("suggestion:"), diagnostic.suggestion);
    console.log(chalk.gray("materials:"), diagnostic.materials);

    // Stable JSON representation for structured logging/transport.
    console.log(chalk.blue.bold("\n🔎 Full JSON"));
    console.log(err.toJSON());

    Deno.exit(0);
  }

  throw err;
}
