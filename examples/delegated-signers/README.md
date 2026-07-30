# Delegated Signers

This project contains four independent
[CAP-71](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0071.md)
delegated authorization examples. Each example deploys only the topology it
demonstrates, funds a top-level contract account with 2 XLM, and withdraws 1 XLM
after Colibri completes the delegated authorization flow.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then enter this project:

```bash
cd examples/delegated-signers
```

Running the examples requires only:

- Internet access to Stellar Testnet and Friendbot
- Deno

The contract WASMs and TypeScript specs are checked in, so Rust and Stellar CLI
are not required unless you want to rebuild the contracts.

## How Delegated Authorization Works

The top-level `DelegatedAssetAccount` is both a custom account and the owner of
the XLM being withdrawn. Its `withdraw` method calls `require_auth()` for its
own contract address.

The account's `__check_auth` implementation does not verify a signature itself.
Instead, it reads the delegated addresses fixed in its constructor, verifies
that the supplied immediate delegates match them, and calls `delegate_auth` for
each one. A delegate can be:

- an Ed25519 `G...` account that verifies a normal signature and terminates the
  branch; or
- a `RecursiveDelegateAccount` contract whose own `__check_auth` delegates
  again.

The application constructs the same topology off-chain with nested
`DelegatedSigner` instances. Only the top-level signer is placed in
`config.signers`; it owns the complete nested tree.

For every example, Colibri's contract invocation pipeline:

1. builds the withdrawal transaction;
2. performs recording simulation to discover the top-level authorization entry;
3. matches that entry with the top-level `DelegatedSigner`;
4. recursively signs each Ed25519 leaf and assembles the delegated credential
   tree;
5. assembles an intermediate transaction containing the delegated entries;
6. performs enforcing simulation, where Stellar executes every custom account's
   `__check_auth` and validates the leaf signatures;
7. uses the enforcing simulation resources to assemble, envelope-sign, and
   submit the final transaction.

The transaction source is a separate disposable `admin` account. It pays fees,
deploys the contracts, funds the top-level account, and signs the transaction
envelope. The delegated signers authorize the contract account's withdrawal;
they do not act as the transaction source.

The Ed25519 leaves are funded Testnet accounts because Stellar resolves their
account signer weights during enforcing simulation.

Each entrypoint is a complete, self-contained example. The files intentionally
repeat Testnet setup, WASM upload, contract deployment, signer construction,
funding, invocation, and result inspection so that readers can follow one path
from beginning to end without jumping into an example-only wrapper.

The only separate code is the generated contract specs and reproducible contract
build tooling under [`./contracts`](./contracts). Every Colibri call a developer
would make in an application remains visible in the runnable file.

## 1. Direct Delegate

Source: [`direct-delegate.ts`](./direct-delegate.ts)

```text
DelegatedAssetAccount
└── Ed25519 leaf
```

The top-level asset account names one `G...` address as its immediate delegate.
The matching off-chain tree contains the top-level contract node and one leaf
`DelegatedSigner` backed by a `LocalSigner`. There is no intermediate custom
account: the top-level contract delegates directly to the account that verifies
the signature.

Run only this example:

```bash
deno task direct
```

## 2. Recursive Contract Delegate

Source: [`recursive-delegate.ts`](./recursive-delegate.ts)

```text
DelegatedAssetAccount
└── RecursiveDelegateAccount
    └── Ed25519 leaf
```

This introduces one contract delegate between the asset account and the leaf.
The asset account delegates to the recursive contract, and that contract's
`__check_auth` delegates to the `G...` account. The off-chain `DelegatedSigner`
tree mirrors both contract addresses before reaching the signing leaf.

Run only this example:

```bash
deno task recursive
```

## 3. Deeply Nested Delegates

Source: [`nested-delegates.ts`](./nested-delegates.ts)

```text
DelegatedAssetAccount
└── Outer RecursiveDelegateAccount
    └── Inner RecursiveDelegateAccount
        └── Ed25519 leaf
```

This extends the recursive case into a deeper chain. Authorization must traverse
the top-level asset account and two independent recursive contract accounts
before the Ed25519 signature terminates the branch. It demonstrates that
`DelegatedSigner` is genuinely recursive rather than limited to one contract
level.

Run only this example:

```bash
deno task nested
```

## 4. Branching Delegates

Source: [`branching-delegates.ts`](./branching-delegates.ts)

```text
DelegatedAssetAccount
├── RecursiveDelegateAccount A
│   └── Ed25519 leaf A
└── RecursiveDelegateAccount B
    └── Ed25519 leaf B
```

Unlike the previous examples, this topology fans out instead of forming one
chain. The asset account expects both recursive contracts as immediate
delegates, and each branch expects its own Ed25519 leaf. Both leaves sign the
authorization payload, and enforcing simulation validates the complete
two-branch tree.

Run only this example:

```bash
deno task branching
```

## Contract Roles

The project uses two deliberately small educational contracts:

- `DelegatedAssetAccount` owns XLM through its Stellar Asset Contract
  representation, exposes `withdraw`, and starts delegated authorization.
- `RecursiveDelegateAccount` owns no assets in these examples. It exists only as
  a reusable custom-account authorization node that can delegate to accounts or
  more instances of itself.

Both contracts store their allowed immediate delegates in instance storage at
construction. Their `__check_auth` implementations require the supplied delegate
set to match that configuration before calling `delegate_auth`.

Production custom accounts need deliberate recovery, rotation, upgrade, policy,
and lifecycle designs beyond these focused examples.

## Reproducible Contract Artifacts

The contract sources, WASM files, generated TypeScript specs, and artifact
hashes live under [`./contracts`](./contracts).

To rebuild them, install Rust with the `wasm32v1-none` target and a recent
Stellar CLI that supports `stellar contract build` and
`stellar contract info interface`. The build helper does not enforce an exact
CLI version and is compatible with Stellar CLI 27.

Rebuild the checked-in artifacts:

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
- [Stellar CLI manual](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Colibri repository](https://github.com/fazzatti/colibri)
