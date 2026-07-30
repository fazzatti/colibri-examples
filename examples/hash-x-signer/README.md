# Hash-X Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to authorize a
Stellar Testnet payment by revealing a Hash-X preimage.

## What Is Hash-X?

Hash-X is one of Stellar's account signer types. Instead of storing a public
key, the account stores the SHA-256 hash of a secret value called a preimage.
The signer is represented as an `X...` StrKey.

To authorize a transaction:

1. the transaction envelope reveals the preimage;
2. Stellar hashes that value with SHA-256; and
3. the resulting hash must match the `X...` signer installed on the account.

Hash-X is therefore a reveal-on-use mechanism, not a reusable digital signature.
Once submitted, the preimage is visible to anyone who can read the transaction
envelope.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/hash-x-signer
deno task hash-x
```

The script:

1. creates and funds a disposable source account and recipient;
2. generates a hidden random preimage with `HashXSigner`;
3. installs its `X...` hash with weight 1 and sets the account thresholds to 1;
4. targets the signer to the source account so Colibri can match it to the
   envelope-signing requirement;
5. submits a 1 XLM payment using only the Hash-X signer;
6. removes the disclosed signer with the account's master key; and
7. zeroizes the retained preimage.

The master key remains active throughout the example. It is not used for the
payment, but it provides the recovery path needed to remove the Hash-X signer
after disclosure.

## Colibri's Role

`HashXSigner` keeps the preimage, derives its hash and `X...` identity, declares
which account it signs for, and adds the preimage to the transaction envelope.
The classic transaction pipeline determines the source account's signing
requirement and routes it to that capability.

The example passes `true` to `HashXSigner.generateRandom(true)`, which hides
direct preimage access from application code while retaining the value for
envelope authorization.

## Security Boundary

A submitted Hash-X envelope publishes its preimage permanently. Removing the
account signer prevents that disclosed value from authorizing later
transactions. Calling `destroy()` additionally zeroizes Colibri's in-memory copy
on a best-effort basis, but it cannot remove the value from ledger history.

Never reuse a disclosed preimage for another signer or authorization policy.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [Stellar multisignature documentation](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#multisig)
- [Colibri repository](https://github.com/fazzatti/colibri)
