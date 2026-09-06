# Native liquidity pool: deposit and withdraw

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Create an isolated MARKET-style demo asset/XLM pool position with
`NativeLiquidityPool`, read its ownership fraction, and withdraw it.

## Run

From the repository root:

```sh
cd examples/liquidity-pool
deno task liquidity
```

- `liquidity`: Create required trustlines, deposit up to 10 POOL and 20 XLM,
  inspect the position, and withdraw the full share balance.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Create the provider's asset trustline and fund it with issued demo units.
2. Create a separate pool-share trustline.
3. Supply labelled amounts and price bounds stated as XLM per POOL; Colibri
   handles canonical A/B ordering.
4. Read pool reserves and holder shares from one RPC observation.
5. Withdraw with explicit minimum outputs, then read the remaining share
   balance.

## Important details

Deposit limits are maxima; withdrawal limits are minima. The initial 2 XLM/POOL
ratio is chosen for this isolated demonstration, not discovered or recommended.
Shares/totalShares is an exact ownership fraction, not a future withdrawal
quote. Real prices/reserves may change before execution. Pool shares use seven
decimal places. This example does not perform routing, price discovery, or
financial advice.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
