# Native XLM payment

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Build a native Stellar payment with an ordinary Stellar SDK `Operation`, then
call Colibri's transaction pipeline as a function.

## Run

From the repository root:

```sh
cd getting-started/native-payment
deno task payment
```

- `payment`: Send 1 XLM between fresh Testnet accounts.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Create two local signers and fund their Testnet accounts with Friendbot.
2. Set source, signers, fee policy, and transaction validity explicitly.
3. Pass the native operation to `sendPayment(...)`.
4. Read the confirmed transaction hash, ledger, fee charged, and runtime
   operation outcome.

## Important details

An XLM payment needs no trustline. This path does not invoke Soroban or require
a Wasm. `fee` is in stroops; payment `amount` is in decimal XLM. A transaction
timeout controls validity, not the HTTP request duration.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
