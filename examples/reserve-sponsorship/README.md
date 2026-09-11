# Sponsor a trustline's reserve

A trustline increases an account's minimum-balance requirement. Reserve
sponsorship lets another account take on that obligation while the holder keeps
ownership of the trustline.

This example uses `wrapSponsorship` to place an ordinary `changeTrust` operation
between the native begin/end sponsorship operations. Both account roles and
signatures remain visible in the transaction.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/reserve-sponsorship
deno task trustline
```

The script funds a sponsor and holder on Testnet through Friendbot. Here the
sponsor also acts as the asset's issuer and the transaction source.

## Follow the sponsorship block

Open [`sponsored-trustline.ts`](./sponsored-trustline.ts):

1. Define the issued asset and a `changeTrust` operation with the **holder** as
   its operation source.
2. Wrap that operation in a sponsorship block for the sponsor and holder.
3. Submit the resulting three operations with both signers. The sponsor accepts
   the reserve obligation; the holder authorizes its trustline.
4. Read the new trustline through RPC.

Expect a confirmed transaction and a trustline with **limit 1,000** and
**balance 0**, printed in smallest units. Creating the trustline does not issue
tokens to the holder.

## Reserve and fee sponsorship

The sponsor assumes a minimum-balance obligation; it does not transfer custody
of the holder's assets. This script also uses the sponsor as transaction source,
so it pays the fee in the ordinary way. A separate outer fee payer is covered by
[the fee-bump lesson](../fee-bump/README.md).

## Learn more

- [Issue and transfer an asset](../stellar-asset/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
