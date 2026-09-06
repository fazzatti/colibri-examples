# SEP-53 message signatures

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Sign a message with LocalSigner and verify it using only a native Stellar SDK
public-key verifier.

## Run

From the repository root:

```sh
cd examples/message-signing
deno task message
```

- `message`: Print true for the original message and false for a changed
  message.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Generate an unfunded signer.
2. Use signMessage, not raw transaction signing.
3. Verify the original and changed messages with the same public key.

## Important details

No transaction, account creation, or RPC request is involved. Message signing is
not a complete authentication flow: applications still need audience, nonce,
expiry, and replay policies. Use [WebAuth](../webauth/README.md) for
SEP-10/SEP-45 login protocols.
