# Claimable balances with a refund path

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Use native `Claimant` values and `ClaimableBalancePredicates` to state who may
claim a balance and when. Both scripts create their own independent balance.

## Run

From the repository root:

```sh
cd examples/claimable-balance
deno task claim
deno task refund
```

- `claim`: Recipient claims before a ten-minute relative deadline.
- `refund`: Sender reclaims an unclaimed balance after a short absolute
  deadline.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Create two complementary claimant predicates: recipient before the deadline,
   sender after it.
2. Create the balance through `StellarAsset.createClaimableBalance`.
3. Extract its actual balance ID from the confirmed operation outcome.
4. Submit an explicit `claimClaimableBalance` operation signed by the eligible
   claimant.

## Important details

Expiration does not move money automatically. The refund example polls ledger
close time, with a bounded wait, before submitting the sender's claim. Relative
predicates begin at the balance-creation ledger; absolute predicates compare
with ledger close time. A computer clock is not the consensus clock. Either
claim consumes the balance, so these examples are separate rather than two
commands sharing state.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
