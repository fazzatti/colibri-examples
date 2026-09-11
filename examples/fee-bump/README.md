# Let a sponsor pay the transaction fee

A fee-bump transaction wraps an already authorized transaction in an outer
envelope with a separate fee payer. The sender still authorizes the payment; the
sponsor authorizes paying its fee.

This example attaches `createFeeBumpPlugin` to Colibri's native payment
pipeline, then inspects the inner and outer envelopes of a confirmed 1-XLM
payment.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/fee-bump
deno task payment
```

The script generates and funds a sender, recipient, and sponsor on Testnet with
Friendbot. Open [`sponsored-payment.ts`](./sponsored-payment.ts) as it runs.

## Follow the two roles

1. Configure the sender's transaction and create the callable payment pipeline.
2. Create the fee-bump plugin with the sponsor's signer and fee settings.
3. Attach it with `sendPayment.use(...)`, then call the same pipeline with the
   sender's payment operation and configuration.
4. Decode the confirmed `FeeBumpTransaction` and inspect the inner source, outer
   fee source, outer bid, and charged fee.

Expect a confirmed hash, with the sender as the inner transaction source and the
sponsor as the outer fee source. The sponsor's signature does not grant
permission to spend the sender's payment funds.

## Fees versus reserves

The outer bid must cover the inner transaction and the additional fee-bump
operation. Its configured bid can differ from the ledger's actual charge.

Paying a transaction fee does not sponsor an account's minimum balance. The
[reserve sponsorship lesson](../reserve-sponsorship/README.md) covers that
separate obligation. After this example, see
[channel accounts](../channel-accounts/README.md) for combining fee sponsorship
with independent transaction sequences.

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [Compare fee policies](../fees/README.md)
