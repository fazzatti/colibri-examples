# colibri-examples

A collection of examples using the @colibri tools for the Stellar network.
Navigate to each directory to find the instructions of the respective example in
their `README.md` file.

## Prerequisites

- [Deno](https://deno.land/) runtime installed

## Setup

1. Install the dependencies by running:

```bash
deno install
```

Then proceed to the desired example under `./examples/` and follow its
instructions.

## Getting Started

If you're new to Colibri, start with the examples under
[`./getting-started/`](./getting-started/). These simpler examples walk through
the SDK's core concepts step by step.

- `handling-errors` - Learn how to identify a Colibri error and read metadata
  for graceful handling.
- `contract-transfer` - Perform a simple XLM transfer using the Stellar Asset
  Contract (SAC).

## Examples

Each example under [`./examples/`](./examples/) has its own `README.md` with
setup and usage details:

- [`event-streamer`](./examples/event-streamer/README.md) - Ingest Soroban
  contract events in live and archival modes with `@colibri/rpc-streamer`.
- [`sep10`](./examples/sep10/README.md) - Authenticate with a Stellar anchor
  using the SEP-10 Web Authentication flow via `@colibri/sep10`.
- [`stellar-test-ledger`](./examples/stellar-test-ledger/README.md) - Use
  `StellarTestLedger` for ephemeral integration tests and reusable local
  Quickstart ledgers with Lab, explorer, and transaction scripts.

## About @colibri

This project is built with [@colibri](https://github.com/fazzatti/colibri), a
TypeScript-first toolkit for building robust Stellar and Soroban applications.
Colibri provides deterministic error handling, composable transaction pipelines,
and an extensible plugin architecture. Key packages include
[@colibri/core](https://jsr.io/@colibri/core) for transaction orchestration and
event parsing, and [@colibri/rpc-streamer](https://jsr.io/@colibri/rpc-streamer)
for streaming Soroban RPC data (including contract events). Learn more at the
[GitHub repository](https://github.com/fazzatti/colibri).
