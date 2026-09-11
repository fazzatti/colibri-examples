# Work with a Stellar asset

These examples use `StellarAsset` to issue and move a native Stellar asset, then
explore two issuer policies: authorization and clawback. An asset is identified
by its code **and issuer**, so each script creates a fresh asset of its own.

Colibri submits the native asset operations through its transaction pipeline.
The [SAC issuance lesson](../../getting-started/issue-asset/README.md) shows how
to work with the same asset model through a contract interface.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/stellar-asset
```

Each command is independent and funds its own disposable Testnet accounts with
Friendbot. Choose a workflow and open the corresponding TypeScript file.

## 1. Issue, transfer, and burn

```sh
deno task lifecycle
```

In [`mint-transfer-burn.ts`](./mint-transfer-burn.ts), the issuer creates the
asset client, and Alice and Bob establish trustlines before receiving it. The
issuer then mints 100 DEMO to Alice, Alice transfers 25 to Bob, and Bob burns 5.

Minting sends units from the issuer; burning sends them back. The signer changes
with the source of each payment. The final balances are **75 DEMO for Alice**
and **20 DEMO for Bob**.

## 2. Require issuer authorization

```sh
deno task authorization
```

In [`authorization.ts`](./authorization.ts), the issuer enables authorization
requirements before the holder creates a trustline. The script reads its initial
unauthorized state, authorizes it, mints 10 PERMIT, then revokes transfer
authorization.

`setAuthorized(false)` preserves authorization to maintain liabilities. Read the
reported authorization state to understand the resulting state; this operation
is not a universal freeze.

## 3. Claw back issued units

```sh
deno task clawback
```

In [`clawback.ts`](./clawback.ts), the issuer enables the required flags
**before trustline creation**, mints 10 RECALL, then claws back 3. The holder
ends with **7 RECALL**. Unlike a voluntary burn, this removal is authorized by
the issuer.

## Units and account policy

Native operation amounts are decimal strings with up to seven fractional digits.
The balance reads in these lessons return `bigint` smallest units. Keep that
conversion visible when displaying amounts.

Issuer flags affect the issuer account's asset policy. The separate scripts let
you inspect each policy without carrying flags or balances over from another
run.

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [SEP-41 contract token](../sep41-token/README.md)
