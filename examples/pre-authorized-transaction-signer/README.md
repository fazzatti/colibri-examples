# Pre-Authorized Transaction Signer

This example uses [`@colibri/core`](https://jsr.io/@colibri/core) to install and
execute one exact pre-authorized payment on Stellar Testnet.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then run:

```bash
cd examples/pre-authorized-transaction-signer
deno task pre-authorized
```

## Flow

The script:

1. finalizes a future payment at the sequence following one setup transaction
2. derives its `T...` signer with `PreAuthorizedTransactionSigner`
3. installs the transaction hash through the setup transaction
4. verifies the exact prepared transaction without adding a decorated signature
5. submits it and confirms through Horizon that Stellar removed the signer

A pre-authorized signer is valid for one byte-for-byte exact transaction.
Changing the operations, sequence, fee, memo, preconditions, or network changes
the transaction hash and invalidates the authorization.

## Learn More

- [Colibri signer documentation](https://fifo-docs.gitbook.io/colibri/core/signer)
- [Stellar multisignature documentation](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#multisig)
- [Colibri repository](https://github.com/fazzatti/colibri)
