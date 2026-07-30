# Signed-Payload Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to bind an
Ed25519 signed-payload signer to one prepared Stellar Testnet payment.

## What Is A Signed-Payload Signer?

Stellar's `P...` signer key contains:

- an Ed25519 public key; and
- a fixed payload containing between 1 and 64 bytes.

Its envelope signature signs that payload directly. It is not a normal Ed25519
transaction signature and does not sign the transaction hash automatically.

This flexibility allows protocols to define their own payload meaning. It also
means the application must decide what the payload represents and when it is
safe to release the signature.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/signed-payload-signer
deno task signed-payload
```

The complete example lives in [`signed-payload.ts`](./signed-payload.ts).
Sequence planning, transaction construction, signer installation, envelope
authorization, submission, and cleanup are kept together rather than hidden
behind example-specific helpers.

## Flow

The example follows a two-transaction authorization lifecycle:

```text
Current account sequence: N

Setup transaction   sequence N + 1
└── installs P(public key, hash(future payment))

Future payment      sequence N + 2
└── carries an Ed25519 signature over the embedded payload

Cleanup transaction sequence N + 3
└── removes the persistent P... signer
```

The script:

1. creates a source account, recipient, and separate payload-signing key;
2. finalizes a future 1 XLM payment at sequence `N + 2`;
3. hashes that exact transaction and embeds the hash in a `P...` signer;
4. uses the source account's master key to install the signer at sequence
   `N + 1`;
5. targets the signer to the source account for Colibri's envelope routing;
6. compares the prepared transaction hash with the embedded payload immediately
   before signing;
7. signs the payload and submits the already-finalized payment; and
8. removes the persistent signer with the master key.

## Why Use The Transaction Hash?

A signed payload can contain arbitrary data. This example chooses the future
transaction hash so the application can treat the payload as approval for one
exact transaction. Any change to the sequence, fee, operations, memo,
preconditions, time bounds, or network passphrase changes that hash.

The payload signature is not a normal transaction signature. It signs the
embedded payload directly, so Stellar does not independently compare it with the
transaction being submitted. This example performs that comparison as an
application-level policy before releasing the signature.

## Colibri's Role

`Ed25519SignedPayloadSigner.forTransaction(...)` hashes the finalized
transaction, builds the `P...` signer identity, and later produces the
protocol-specific decorated signature over that payload.

The example uses Colibri's low-level envelope helpers for the prepared payment
so it can sign and submit the exact transaction without rebuilding it. The
ordinary setup and cleanup transactions still use the classic transaction
pipeline.

## Replay Boundary

A disclosed payload signature remains reusable anywhere the same `P...` key is
accepted, so the example removes the persistent signer immediately after use.
The transaction-hash comparison is application policy; Stellar validates the
payload signature but does not make that comparison for the application.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [CAP-40: Signed Payload Signers](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0040.md)
- [Colibri repository](https://github.com/fazzatti/colibri)
