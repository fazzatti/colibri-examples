# Create a claimable balance with a refund path

A claimable balance holds funds until an eligible claimant submits a claim.
Predicates define **who may claim and when**; reaching a deadline does not move
the funds automatically.

These two lessons create a 1-XLM balance with complementary conditions: the
recipient can claim before expiry, and the sender can reclaim it afterward. Each
script creates its own balance, so you can run either one independently.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/claimable-balance
```

Both scripts generate and fund disposable Testnet accounts with Friendbot.

## Claim before expiry

```sh
deno task claim
```

Follow [`claim-before-expiry.ts`](./claim-before-expiry.ts):

1. Build the recipient's ten-minute relative predicate and its complement for
   the sender using `ClaimableBalancePredicates`.
2. Pass native `Claimant` values to `StellarAsset.createClaimableBalance`.
3. Extract the balance ID from the confirmed creation result.
4. Submit `claimClaimableBalance` with the recipient's signature.

The output includes the created balance ID and the confirmed claim. The balance
ID identifies the claimable entry; it is different from the transaction hash.

## Refund after expiry

```sh
deno task refund
```

In [`refund-after-expiry.ts`](./refund-after-expiry.ts), a separate balance uses
an absolute deadline approximately 30 seconds ahead. The script polls ledger
close time, then submits a claim signed by the sender. It waits for at most two
minutes, so a stalled network produces an error instead of an endless wait.

Expect a pause before the confirmed refund. Either successful claim consumes the
balance; the recipient and sender cannot both claim it.

## Which clock matters?

Relative predicates start at the balance-creation ledger. Absolute predicates
use ledger close time. The refund script uses the computer clock to choose its
deadline, then checks the network's clock before attempting the claim.

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [Native payment](../../getting-started/native-payment/README.md)
