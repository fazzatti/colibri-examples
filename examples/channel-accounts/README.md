# Channel accounts: independent transaction sequences

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

A channel supplies a transaction source and its sequence number. The business
account remains the source of the operations that spend its funds. Giving
concurrent transactions different source sequences lets them proceed without
competing for the business account's next sequence number.

Start with native payments, then explore a separate composition with fee bumps
and muxed destinations. Both scripts are independent Testnet workflows with
fresh signers and Friendbot funding.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/channel-accounts
```

## 1. Native payments with channels only

```sh
deno task payments
```

Follow [`parallel-payments.ts`](./parallel-payments.ts):

1. Fund sender and recipient.
2. Open two sponsored channel accounts using `ChannelAccounts.open`.
3. Explicitly fund the channels' fees. Opening sponsors their reserves but
   starts them at zero balance; reserve sponsorship does not pay transaction
   fees.
4. Attach `createChannelAccountsPlugin` to a callable native-payment pipeline.
5. Submit four payments concurrently, keeping the payment operation source set
   to sender while the plugin selects a channel transaction source.
6. Wait for every submission to settle, then close/merge the channels in
   `finally`.

The sender's funds pay the recipient. Channel balances pay inclusion fees. The
pool keeps a channel allocated until its run settles, avoiding simultaneous use
of one channel sequence. Expect four confirmed 1-XLM payments, followed by
channel closure after all submissions have settled.

## 2. Sponsored muxed SAC transfers

```sh
deno task sponsored-muxed-transfers
```

Open [`sponsored-muxed-transfers.ts`](./sponsored-muxed-transfers.ts) after the
first lesson and the [standalone fee-bump example](../fee-bump/README.md).

This advanced composition opens five channels, attaches both plugins to the XLM
SAC invoke pipeline, and submits thirty transfers to muxed destinations. All
destinations are IDs on the sender's own base account. They are self-payments
for demonstration, not thirty new recipient accounts and not mint operations.
The outer fee-bump sponsor pays fees, so zero-balance sponsored channels are
appropriate for this variant.

Expect thirty confirmed transfers and cleanup of the channels. Each muxed ID
labels a logical destination on the same underlying account.

## Batch completion and cleanup

Both scripts wait for every submitted operation to settle before closing their
channels. A failed batch can include successful payments, so inspect individual
results before deciding what to retry.

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [Fee sponsorship](../fee-bump/README.md)
