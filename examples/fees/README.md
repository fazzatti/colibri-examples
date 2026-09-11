# Choose a transaction fee policy

Colibri supports a per-operation base fee, an exact inclusion bid, and a total
Soroban fee cap. These examples submit small Testnet transfers and inspect the
confirmed transaction so you can compare **the bid** with **the actual charge**.

All fee values are in stroops: 10,000,000 stroops equal 1 XLM. Payment amounts
and fees are separate fields with separate units.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/fees
```

Each script funds its own sender and recipient with Friendbot. The commands are
independent; choose the policy you want to inspect.

## Per-operation base fee

```sh
deno task base
```

In [`base.ts`](./base.ts), two native payment operations use `base: "100"`.
Colibri multiplies the per-operation bid by the operation count, producing an
envelope fee of **200 stroops**. The original string form, `fee: "100"`, is the
same per-operation shorthand.

## Exact inclusion bid

```sh
deno task inclusion
```

In [`inclusion.ts`](./inclusion.ts), the same two-operation shape uses
`inclusion: "205"`. The envelope bid is **205 stroops total**, rather than 205
for each operation.

## Total Soroban cap

```sh
deno task max
```

[`soroban-max.ts`](./soroban-max.ts) transfers 1 XLM through its Stellar Asset
Contract with `max: "1000000"`. Soroban adds resource fees determined through
simulation. Colibri reserves those fees and uses the remainder of the cap as the
inclusion bid, rejecting a cap without room for the minimum inclusion fee.

A high cap therefore produces a high bid; it is not a request to find the lowest
fee. This number is a demonstration setting, not a recommended fee policy.

## Read the result

Each script prints the fee from the confirmed envelope and the ledger's charged
fee separately. They can differ. Inspect both when learning how a configured
policy becomes a submitted transaction.

## Learn more

- [Use a separate fee payer](../fee-bump/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
