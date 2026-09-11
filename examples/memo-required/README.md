# Check a recipient's memo requirement

A service can use the SEP-29 account data entry `config.memo_required` to tell
clients it expects a memo. Colibri's `createSep29Plugin` checks that convention
before a payment is submitted.

These two lessons create a recipient that advertises the requirement, then show
the accepted and rejected paths. Each script sets up its own accounts, so either
can run first.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/memo-required
```

The scripts generate and fund disposable Testnet accounts through Friendbot.
They do not depend on an exchange's account or configuration.

## Send a payment with a memo

```sh
deno task payment
```

Follow [`payment-with-memo.ts`](./payment-with-memo.ts):

1. Have the recipient set `config.memo_required` on its account.
2. Create the payment pipeline and attach the SEP-29 plugin.
3. Send 1 XLM with a native Stellar SDK `Memo.id("12345")`.
4. Read the confirmed payment hash.

## Handle a missing memo

```sh
deno task missing
```

[`missing-memo.ts`](./missing-memo.ts) repeats the setup with a new recipient,
then deliberately omits the memo. It catches the specific
`Sep29Errors.MEMO_REQUIRED` error and prints its code and details. An expected
rejection is the successful result of this lesson; no payment is submitted.

## What the guard checks

SEP-29 is a client convention, not a consensus rule requiring a memo. The plugin
checks presence. It cannot establish whether a supplied memo identifies the
intended customer. A muxed destination carries its routing ID separately.

## Learn more

- [Handle structured errors](../../getting-started/handling-errors/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
