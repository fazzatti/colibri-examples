# Read a bounded stream of transactions or payments

Colibri's transaction and operation streamers let you consume RPC history with
an awaited callback. These examples select **five ledgers**, process that slice,
and stop automatically, making the output easy to inspect in a terminal.

Both scripts are read-only and use Testnet RPC. They create no accounts, request
no Friendbot funds, and submit no transactions.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/transaction-streamer
```

You need network access to RPC. Each command selects its own window, beginning
at the latest ledger observed when it starts.

## Inspect transactions

```sh
deno task transactions
```

Follow [`transactions.ts`](./transactions.ts):

1. Fetch the latest ledger and choose `latest + 4` as the inclusive stop ledger.
2. Create a transaction streamer and start ingestion with an awaited callback.
3. Print each transaction's hash, ledger, and success or failure status.
4. Finish when the selected range has been processed.

The callback keeps status visible because a recorded transaction can have
failed.

## Select successful payments

```sh
deno task payments
```

[`payments.ts`](./payments.ts) creates an operation streamer, filters for
successful transactions and native `payment` operations, then prints the payment
with its transaction and operation context.

Here, native means the Stellar payment operation, which can transfer XLM **or an
issued asset**. This filter does not include path payments or Soroban token
events. A quiet five-ledger window may contain no matching payments; an empty
result is valid.

## From a lesson to a persistent consumer

The awaited callback allows processing to finish before ingestion continues. For
a persistent service, also plan checkpoints and idempotent handling because
records can replay after an interruption. An operation found in a failed
transaction must not be interpreted as an executed transfer.

## Learn more

- [Stream Soroban events](../event-streamer/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
