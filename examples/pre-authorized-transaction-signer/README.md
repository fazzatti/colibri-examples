# Pre-Authorized Transaction Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to install and
execute one exact pre-authorized payment on Stellar Testnet.

## What Is A Pre-Authorized Transaction?

Stellar accounts can register a `T...` signer derived from the 32-byte hash of
one complete transaction. When Stellar later receives that exact transaction,
the matching account signer contributes its configured weight without requiring
a decorated signature in the envelope.

This is useful when an account wants to approve one future action in advance. It
is intentionally strict: operations, sequence, fee, memo, preconditions, and
network passphrase all contribute to the transaction hash.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/pre-authorized-transaction-signer
deno task pre-authorized
```

## Sequence Timeline

The future transaction must be finalized before its hash can be installed, but
the setup transaction must execute first. The example plans both sequences:

```text
Current account sequence: N

Setup transaction   sequence N + 1
└── installs T(hash(future payment))

Future payment      sequence N + 2
├── matches the installed transaction hash
├── contains zero decorated signatures
└── consumes and removes the T... signer
```

## Flow

The script:

1. generates and funds a disposable source account and recipient;
2. reads the source account's current sequence;
3. finalizes a future payment at the sequence following one setup transaction;
4. derives its `T...` account signer with
   `PreAuthorizedTransactionSigner.fromTransaction`;
5. installs the raw transaction hash with weight `1` and raises the source
   account's thresholds to `1`;
6. asks that signer to verify the exact prepared transaction without adding a
   decorated signature;
7. submits the unchanged transaction and confirms through Horizon that Stellar
   removed the consumed signer.

The source account's master key signs only the setup. The future payment is
accepted because the transaction itself matches the installed `T...` signer.

## What Colibri Handles

`PreAuthorizedTransactionSigner` derives the StrKey `T...` identity, exposes the
raw 32-byte signer key needed by `setOptions`, verifies that a transaction
matches it, and participates in Colibri's normal envelope-signing abstraction.
For this signer type, successful authorization means preserving the transaction
unchanged rather than appending a signature.

## One-Shot Lifecycle

Stellar automatically removes a matching pre-authorized transaction signer when
that transaction is applied, even if one of its operations fails. If the
transaction is never applied, the signer remains on the account until another
authorized transaction removes it.

A pre-authorized transaction signer also cannot be placed in transaction
`extraSigners`: doing so would create a circular dependency because the signer
is derived from the hash of the transaction containing that precondition.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [Stellar multisignature documentation](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#multisig)
- [Colibri repository](https://github.com/fazzatti/colibri)
