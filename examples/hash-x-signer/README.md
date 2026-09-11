# Hash-X as an additional transaction condition

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

This standalone Testnet lesson requires **both** an ordinary Ed25519 transaction
signature and a Hash-X preimage. It uses the transaction's `extraSigners`
precondition, not an account-wide signer installation.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/hash-x-signer
deno task hash-x
```

## Follow the additional condition

Open [`hash-x.ts`](./hash-x.ts):

1. Create and fund a sender and recipient.
2. Create a random HashXSigner; its X key exposes the SHA-256 digest, not the
   secret.
3. Add that X key to `config.extraSigners` and pass both signers.
4. Call the payment pipeline. Colibri supplies the ordinary signature and the
   preimage, then confirms the payment.
5. Dispose the signer and best-effort zeroize its retained preimage.

Expect a confirmed payment hash. The envelope satisfies both the sender's
ordinary signature requirement and the extra Hash-X condition.

The X key needs no account or funding. No setOptions setup or cleanup
transaction is needed because the condition belongs to this transaction.

## Why not install the hash as the only account signer?

A revealed preimage is public bearer data. Installing its hash as sufficient
account authorization lets anyone reuse the preimage while that signer remains
accepted. Removing it in a later transaction leaves a dangerous interval; simply
removing it in the same transaction is not a general front-running solution.

Here the ordinary sender signature binds the payment's contents. Reusing the
preimage cannot create a new sender signature. Still, do not reuse disclosed
preimages for other authorization policies. Local zeroization cannot erase a
submitted envelope.

Only disposable Testnet accounts are used. This is a protocol lesson, not a
custody or atomic-swap implementation.
