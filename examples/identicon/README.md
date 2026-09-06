# Offline account identicons

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Generate deterministic SVG and PNG representations of a Stellar account address
with `@colibri/identicon`.

## Run

From the repository root:

```sh
cd examples/identicon
deno task render
```

- `render`: Generate a disposable public key and write .output/account.svg and
  .output/account.png.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Create an unfunded keypair; no account or RPC is required.
2. Construct an Identicon from its G address.
3. Render SVG text and PNG bytes to local files.

## Important details

An identicon is a recognition aid, not identity verification or a
collision-resistant substitute for checking an address. This standard represents
account addresses, not contract identities. Output files are ignored by Git.
