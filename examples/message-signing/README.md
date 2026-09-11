# Sign and verify a message

A message signature lets someone with the public key verify that a signer
approved particular message bytes. This example uses `LocalSigner.signMessage`
and verifies the SEP-53 signature with an ordinary Stellar SDK public-key
verifier.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/message-signing
deno task message
```

After dependency installation, this runs offline. The generated signer needs no
funded account, transaction, or RPC connection.

## Follow the signature

Open [`sign-and-verify.ts`](./sign-and-verify.ts):

1. Create a local signer and sign the example message using `signMessage`.
2. Create a verifier containing only that signer's public key.
3. Verify the original message, then try the same signature against changed
   text.

Expect **true** for the original message and **false** for the changed message.
The verifier never receives the secret key.

## Message signing and login

SEP-53 uses a message-signing format distinct from transaction signing. A valid
message signature alone does not implement login: an application must also
define the audience, nonce, expiry, and replay rules. For complete protocol
flows, continue with the [SEP-10 and SEP-45 lessons](../webauth/README.md).

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [@colibri/core on JSR](https://jsr.io/@colibri/core)
