# Signed-Payload Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to bind an
Ed25519 signed-payload signer to one prepared Stellar Testnet payment.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/signed-payload-signer
deno task signed-payload
```

## Flow

The example follows a two-transaction authorization lifecycle:

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
application-level policy before releasing the signature.

A disclosed payload signature remains reusable anywhere the same `P...` key is
accepted, so the example removes the persistent signer immediately after use.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [CAP-40: Signed Payload Signers](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0040.md)
- [Colibri repository](https://github.com/fazzatti/colibri)
