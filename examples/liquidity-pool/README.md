# Deposit into and withdraw from a liquidity pool

This example creates a position in a native Stellar pool containing a freshly
issued POOL asset and XLM. It uses `NativeLiquidityPool` to deposit, inspect
ownership, and withdraw the full position.

A pool-share trustline is separate from the trustline for the issued asset.
Shares represent the holder's fraction of the pool; they are not another name
for the deposited POOL tokens.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/liquidity-pool
deno task liquidity
```

The script funds a disposable issuer and provider on Testnet with Friendbot. The
fresh asset gives this demonstration its own pool.

## Follow the position

Open [`deposit-and-withdraw.ts`](./deposit-and-withdraw.ts):

1. Create the provider's POOL trustline, then mint 100 POOL to it.
2. Construct the pool client and establish a separate pool-share trustline.
3. Deposit at most **10 POOL and 20 XLM**, with explicit price bounds of
   **1.9–2.1 XLM per POOL**. Labelled inputs let Colibri handle canonical asset
   ordering without changing the meaning of the limits.
4. Read reserves, total shares, and the provider's shares from a ledger
   observation. Inspect the exact `shares / totalShares` ownership fraction.
5. Withdraw every owned share, requiring at least **9.9 POOL and 19.9 XLM**,
   then read the remaining share balance.

The script awaits both transactions. Its output shows the observed ownership
fraction and then **zero remaining shares**.

## Understand the limits

Deposit amounts are maxima; withdrawal amounts are minima. The initial price is
chosen for this isolated example. The script does not discover a market price or
calculate a recommended trade.

An observed ownership fraction describes the pool at that ledger. It is not a
guarantee of future withdrawal amounts: reserves can change before execution.
Pool shares use seven decimal places.

## Learn more

- [Exact asset-labelled prices](../sdex/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
