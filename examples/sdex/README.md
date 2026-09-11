# Create, update, and cancel Stellar offers

These examples use `SDEX` to manage a known offer, and `StellarPrice` to express
its price with explicit asset units. A sell offer specifies units to sell and a
minimum price; a buy offer specifies units to buy and a maximum price.

The networked scripts issue a fresh MARKET asset so the demonstration starts
without existing counter-offers. They are independent workflows, not the two
sides of a trade with each other.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/sdex
```

The price lesson is offline after dependency installation. The offer lessons
fund disposable Testnet accounts with Friendbot.

## 1. Understand price units

```sh
deno task prices
```

[`prices.ts`](./prices.ts) starts with the exact decimal `"1.25"`, represented
as `5/4`, then constructs `2/3` from labelled amounts, describes its units,
inverts it, and compares prices. Ratios stay exact without floating-point
arithmetic. A displayed ratio such as `2/3` is not a decimal-string input.

## 2. Manage a sell offer

```sh
deno task sell
```

Follow [`sell-offer.ts`](./sell-offer.ts):

1. Fund the issuer and trader, create the trader's trustline, and mint MARKET.
2. Offer to sell **10 MARKET for at least 2 XLM each**.
3. Inspect the confirmed operation's effect and extract the created offer ID.
4. Read that known offer through RPC, then update it to sell **5 MARKET for at
   least 2.5 XLM each**.
5. Cancel the offer to release its remaining liabilities.

Expect a created offer ID, its stored amount and price, and the confirmed
cancellation operation result. The update is awaited before cancellation.

## 3. Manage a buy offer

```sh
deno task buy
```

[`buy-offer.ts`](./buy-offer.ts) offers to buy **5 MARKET for at most 2 XLM
each**. It obtains the created offer ID from the confirmed result, updates the
remaining buy amount to **3 MARKET at a maximum of 1.5 XLM each**, then cancels
it.

## Read the effect before assuming an offer exists

A successful operation can immediately fill an offer or leave only part of it on
the ledger. These scripts explicitly require the creation effect before using
its ID. The prices here are chosen limits, not discovered market quotes. RPC
lookup of a known offer does not provide an order book or path discovery.

## Learn more

- [Native liquidity pool](../liquidity-pool/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
