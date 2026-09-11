# Handling Errors Example

This example demonstrates how to capture a Colibri error in a deterministic way,
narrow it to a specific error class, and extract structured context from the
error object (`code`, `domain`, `meta`, `diagnostic`).

## Overview

The example showcases:

- Triggering a deterministic error with an invalid base fee
- Checking a **specific error instance** with `instanceof`
- Accessing error metadata to diagnose and respond

## Usage

Before proceeding, make sure to follow the setup described in the
[workspace README](../../README.md).

### Run the Example

```bash
cd getting-started/handling-errors
deno task handling-errors
```

Follow [`handling-errors.ts`](./handling-errors.ts). The zero base fee fails
local transaction validation before any RPC submission, so this lesson needs no
funded accounts.

Expected outcome:

- Transaction construction fails immediately due to the invalid base fee
- The script detects the specific error class
- The script prints error code, domain, and metadata
- The script prints the SDK-provided suggestion

## Key Concepts

### Specific Error Checks

The example checks for a specific error class first:

```ts
// Propagate unrelated failures before handling the expected Colibri error.
if (!(err instanceof BTX_ERRORS.BASE_FEE_TOO_LOW_ERROR)) throw err;

// TypeScript now knows the precise error type and its input metadata.
const input = err.meta.data.input;
console.log("Rejected base fee:", input.baseFee);
```

Match the specific SDK error class or its code instead of comparing
human-readable message text. The guard lets unrelated failures propagate rather
than treating every failure as the expected outcome.

### Metadata Access

This error exposes the rejected input in structured metadata. Inspect it
alongside the code and domain:

```ts
console.log("meta:", err.meta);
```

### Handling Pattern

Once the error is identified, the example shows a practical handling pattern you
can reuse in apps:

- Classify by `code` and `domain` to decide the handling path
- Use `meta` to extract the exact inputs that caused the failure
- Use `diagnostic` (root cause + suggestion) to guide the next action
- Log the error in a structured way (e.g., `toJSON()`) so you don't lose context

## Learn More

- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
