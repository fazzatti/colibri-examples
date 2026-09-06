# Bounded transaction and payment ingestion

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Read five ledgers through the transaction or operation streamer. These examples
are finite and do not need a manually interrupted infinite subscription.

## Run

From the repository root:

```sh
cd examples/transaction-streamer
deno task transactions
deno task payments
```

- `transactions`: Print transaction hash, ledger, and success/failure status.
- `payments`: Print only successful native payment operations with transaction
  and operation context.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Ask RPC for the latest ledger and choose an explicit inclusive stop ledger.
2. Start the selected Colibri stream with an awaited callback.
3. Keep transaction status visible or filter it before interpreting operations
   as executed.
4. Stop automatically after the bounded slice.

## Important details

A quiet interval may contain no matching payments. The payment lesson does not
include path payments or Soroban token events. An operation present in a failed
transaction is not an executed transfer. Callbacks can replay after
interruption; persistent consumers should implement idempotency/checkpoints.
This is ingestion tooling, not Horizon parity, an order-book indexer, or path
discovery.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
