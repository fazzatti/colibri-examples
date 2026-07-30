# Stellar Signer Examples

These examples demonstrate the signer mechanisms available in
[`@colibri/core`](https://jsr.io/@colibri/core):

- delegated Soroban authorization entries
- Hash-X transaction signatures
- Ed25519 signed-payload transaction signatures
- pre-authorized transactions

Each script creates disposable identities and runs against Stellar Testnet.
Nothing here should be used as persistent key-management infrastructure.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then enter this directory:

```bash
cd examples/signers
```

All four examples require Internet access to Stellar Testnet and Friendbot. The
delegated example also requires:

- Rust with the `wasm32v1-none` target
- Stellar CLI `26.1.0`

## Delegated Authorization

Run:

```bash
deno task delegated
```

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

## Hash-X

Run:

```bash
deno task hash-x
```

The script:

1. generates a random preimage with `HashXSigner`
2. installs its `X...` hash as an account signer
3. submits a payment signed only by revealing the preimage
4. removes the now-disclosed signer with the account's master key
5. zeroizes the retained preimage

A Hash-X signature publishes its preimage in the transaction envelope. Never
reuse that value after disclosure.

## Transaction-Bound Signed Payload

Run:

```bash
deno task signed-payload
```

This example uses the two-transaction authorization lifecycle:

1. finalize a future payment at the sequence following one setup transaction
2. create `Ed25519SignedPayloadSigner` with the future transaction hash as its
   payload
3. install the resulting `P...` signer through the setup transaction
4. check that the prepared transaction still hashes to the embedded payload
5. sign the payload and submit the prepared payment
6. remove the signer with the account's master key

The payload signature is not a normal transaction signature. It signs the
embedded payload directly, so Stellar does not independently compare it with the
transaction being submitted. This example performs that comparison as an
application-level policy before releasing the signature. A disclosed payload
signature remains reusable anywhere the same `P...` key is accepted, so the
example removes the persistent signer immediately after use.

## Pre-Authorized Transaction

Run:

```bash
deno task pre-authorized
```

The script:

1. finalizes a future payment at the sequence following one setup transaction
2. derives its `T...` signer with `PreAuthorizedTransactionSigner`
3. installs the transaction hash through the setup transaction
4. verifies the exact prepared transaction without adding a decorated signature
5. submits it and confirms through Horizon that Stellar removed the signer

A pre-authorized signer is valid for one byte-for-byte exact transaction.
Changing the operations, sequence, fee, memo, preconditions, or network changes
the transaction hash and invalidates the authorization.

## Reproducible Contract Artifacts

The delegated contract sources, WASM files, generated TypeScript specs, and
artifact hashes live under [`./contracts`](./contracts).

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
- [CAP-40: Signed Payload Signers](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0040.md)
- [CAP-71: Delegated Soroban Authorization](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0071.md)
- [Colibri repository](https://github.com/fazzatti/colibri)
