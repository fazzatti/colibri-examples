# Delegated Signers

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to compose and
execute delegated Soroban authorization on Stellar Testnet.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then enter this directory:

```bash
cd examples/delegated-signers
```

The example requires:

- Internet access to Stellar Testnet and Friendbot
- Rust with the `wasm32v1-none` target
- Stellar CLI `26.1.0`

Run it with:

```bash
deno task delegated
```

## Flow

The example builds and deploys two educational custom-account contracts:

- `DelegatedAssetAccount`, the top-level account that owns XLM through its
  Stellar Asset Contract representation
- `RecursiveDelegateAccount`, a reusable delegate node that can delegate again

It then funds and withdraws from four independently deployed topologies:

1. one direct Ed25519 delegate
2. one recursive contract delegate
3. a deep chain with two recursive contract nodes
4. a branching hierarchy with two contract delegates

The off-chain topology is assembled with recursive `DelegatedSigner` instances.
Colibri records the top-level authorization entry, signs every configured leaf,
assembles the delegated credential tree, performs enforcing simulation, and
submits the final transaction.

The Ed25519 leaves are funded Testnet accounts because Stellar resolves their
account signer weights while enforcing the delegated tree. They do not act as
transaction sources in this example.

The contracts are small Protocol 27 demonstrations. Production custom accounts
need deliberate recovery, rotation, upgrade, policy, and lifecycle designs.

## Reproducible Contract Artifacts

The contract sources, WASM files, generated TypeScript specs, and artifact
hashes live under [`./contracts`](./contracts).

Rebuild them:

```bash
deno task contract:build
```

Verify that the checked-in artifacts reproduce exactly:

```bash
deno task contract:check
```

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [CAP-71: Delegated Soroban Authorization](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0071.md)
- [Colibri repository](https://github.com/fazzatti/colibri)
