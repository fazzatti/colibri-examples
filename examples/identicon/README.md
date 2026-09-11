# Render an account identicon

An identicon gives a Stellar account address a recognizable visual pattern. This
example uses `@colibri/identicon` to render the same address as SVG text and PNG
bytes, then saves both for inspection.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/identicon
deno task render
```

After dependencies are installed, the script runs offline. It generates a public
G address locally; the account does not need to exist on a network.

## Follow the rendering

Open [`render.ts`](./render.ts):

1. Generate a disposable keypair and take its public address.
2. Construct an `Identicon` from that address.
3. Write the SVG and a 224-pixel PNG into this lesson's ignored `.output/`
   directory.

Open `.output/account.svg` and `.output/account.png` to compare them. The script
prints the address that produced the images. Each run generates a new address;
reuse an address when experimenting with repeatable output.

## What the image represents

For the same address and implementation, rendering is deterministic. It is a
recognition aid, not proof of ownership or a substitute for checking the full
address. This example uses account addresses, not contract identities.

## Learn more

- [@colibri/identicon on JSR](https://jsr.io/@colibri/identicon)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
