# Three explicit transaction fee policies

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Separate scripts compare per-operation base fees, exact inclusion bids, and
Soroban total fee caps. They read the confirmed envelope instead of assuming
that configuration equals the charged fee.

## Run

From the repository root:

```sh
cd examples/fees
deno task base
deno task inclusion
deno task max
```

- `base`: Two payments, base 100 stroops per operation: envelope bid 200.
- `inclusion`: Two payments, exact inclusion bid 205 stroops total.
- `max`: One SAC transfer with a total Soroban fee cap of 1,000,000 stroops.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Fund independent Testnet accounts in each script.
2. Set exactly one structured fee mode.
3. Submit and confirm through Colibri.
4. Decode the confirmed envelope fee and print the actual ledger charge
   separately.

## Important details

For Soroban, max includes both resource and inclusion fees. Colibri subtracts
resources and uses the remaining cap as the inclusion bid; it rejects
insufficient room for the minimum inclusion. A high max is therefore a high bid,
not a recommendation to spend that amount. The original string fee remains a
per-operation base-fee shorthand. Timeout bounds transaction validity, not
confirmation latency.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
