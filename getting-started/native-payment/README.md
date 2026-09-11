# Send a native XLM payment

This example sends 1 XLM between two Testnet accounts using a native Stellar
`Operation.payment` and Colibri's transaction pipeline. Start here to learn how
an operation, transaction configuration, and signer fit together.

A native payment moves an account's XLM directly. The
[SAC transfer lesson](../contract-transfer/README.md) performs a transfer
through a smart contract instead.

## Usage

Follow the setup in the [workspace README](../../README.md), then run:

```sh
cd getting-started/native-payment
deno task payment
```

The script creates and funds disposable Testnet accounts with Friendbot. It
needs internet access; you do not need an existing account or contract.

## Follow the payment

Open [`payment.ts`](./payment.ts) alongside the terminal:

1. Create local signers for the sender and recipient, then fund both accounts.
2. Set the sender as transaction source and provide its signer. The recipient
   receives the payment without signing it.
3. Create a callable pipeline with `createClassicTransactionPipeline` and pass
   an ordinary `Operation.payment` to it.
4. Read the confirmed hash, ledger, charged fee, and payment outcome.

A successful run prints a confirmed transaction and a successful payment result.

## Amounts, fees, and validity

The payment's `amount: "1"` is decimal XLM. The base fee of `"100"` is in
stroops per operation; one XLM is 10,000,000 stroops. These fields describe
separate quantities. The transaction timeout limits when the network can include
it, rather than how long an HTTP request may take.

XLM needs no trustline. For an issued asset, see the
[asset issuance lesson](../issue-asset/README.md).

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [@colibri/core on JSR](https://jsr.io/@colibri/core)
