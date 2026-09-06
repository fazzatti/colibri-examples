# A separate transaction fee payer

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Attach `createFeeBumpPlugin` to an ordinary payment pipeline. The sender
authorizes the payment, while a sponsor authorizes the outer fee-bump envelope.

## Run

From the repository root:

```sh
cd examples/fee-bump
deno task payment
```

- `payment`: Pay 1 XLM and inspect the confirmed inner and outer envelope
  sources and fees.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Fund sender, recipient, and fee sponsor.
2. Construct a callable payment pipeline and attach the plugin without replacing
   the pipeline variable.
3. Pass the sender's original operations/configuration to the pipeline.
4. Decode the confirmed envelope and distinguish the business source from the
   fee source.

## Important details

This example does not use channel accounts or reserve sponsorship. A fee-bump
fee must cover the inner transaction plus the outer fee-bump operation. The fee
is a bid; the ledger can charge less. The plugin is attached to a real process
in the pipeline, not an application-side wrapper.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
