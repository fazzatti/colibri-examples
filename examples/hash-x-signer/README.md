# Hash-X Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to authorize a
Stellar Testnet payment by revealing a Hash-X preimage.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/hash-x-signer
deno task hash-x
```

The script:

1. generates a random preimage with `HashXSigner`
2. installs its `X...` hash as an account signer
3. submits a payment signed only by revealing the preimage
4. removes the now-disclosed signer with the account's master key
5. zeroizes the retained preimage

A Hash-X signature publishes its preimage in the transaction envelope. Never
reuse that value after disclosure.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [Stellar multisignature documentation](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#multisig)
- [Colibri repository](https://github.com/fazzatti/colibri)
