# Channel accounts: independent transaction sequences

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

A channel supplies a transaction source and its sequence number. The business
account can remain the source of the operations. Two independent lessons keep
the basic feature separate from fee-bump and muxed-address composition.

## 1. Native payments with channels only

```sh
cd examples/channel-accounts
deno task payments
```

Read `parallel-payments.ts`:

1. Fund sender and recipient.
2. Open two sponsored channel accounts using ChannelAccounts.open.
3. Explicitly fund the channels' fees. Opening sponsors their reserves but
   starts them at zero balance; reserve sponsorship does not pay transaction
   fees.
4. Attach createChannelAccountsPlugin to a callable native-payment pipeline.
5. Submit four payments concurrently, keeping the payment operation source set
   to sender while the plugin selects a channel transaction source.
6. Wait for every submission to settle, then close/merge the channels in
   finally.

The sender's funds pay the recipient. Channel balances pay inclusion fees. The
pool keeps a channel allocated until its run settles, avoiding simultaneous use
of one channel sequence.

## 2. Sponsored muxed SAC transfers

```sh
deno task sponsored-muxed-transfers
```

Read `sponsored-muxed-transfers.ts` only after the first lesson and the
[standalone fee-bump example](../fee-bump/README.md).

This advanced composition opens five channels, attaches both plugins to the XLM
SAC invoke pipeline, and submits thirty transfers to muxed destinations. All
destinations are IDs on the sender's own base account. They are self-payments
for demonstration, not thirty new recipient accounts and not mint operations.
The outer fee-bump sponsor pays fees, so zero-balance sponsored channels are
appropriate for this variant.

Both files have complete visible setup and their own command. They share no
example runner or hidden transaction wrapper. Testnet only; do not blindly retry
an entire failed batch because some payments may already have succeeded.
