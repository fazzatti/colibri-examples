# SDEX offer lifecycles

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Create, read, update, and cancel known Stellar offers using `SDEX`. The two
scripts are independent: neither requires running the other first.

## Run

From the repository root:

```sh
cd examples/sdex
deno task sell
deno task buy
deno task prices
```

- `sell`: Sell MARKET for XLM with a minimum receive-per-unit limit.
- `buy`: Buy MARKET using XLM with a maximum spend-per-unit limit.
- `prices`: Offline exact-decimal, ratio, inverse, and unit-label examples.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Fund issuer and trader, establish the trader's trustline, and mint the fresh
   demo asset.
2. Submit one limit offer using asset-labelled price terminology.
3. Narrow the confirmed native operation result and obtain the created offer ID.
4. Read/update that same offer, then cancel it to release liabilities.

## Important details

The sell price '2' means at least 2 XLM per MARKET. The buy price '2' means at
most 2 XLM spent per MARKET. These are limits, not market quotes. The fresh
asset avoids pre-existing counter-orders; a real offer can instead be consumed
immediately or partially filled. Always inspect the reported effect. RPC can
look up a known offer; these examples do not discover an order book, trades, or
paths. `StellarPrice` also supports exact ratio helpers; see `prices.ts` for an
offline explanation without floating-point arithmetic.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
