# Sponsor a trustline reserve

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Use `wrapSponsorship` to compose the native begin/changeTrust/end operations
while keeping both account roles visible.

## Run

From the repository root:

```sh
cd examples/reserve-sponsorship
deno task trustline
```

- `trustline`: Create a holder trustline whose reserve is paid by a sponsor.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Fund a sponsor/issuer and a holder.
2. Set the trustline operation source to the holder.
3. Wrap only that operation inside a sponsorship block.
4. Include both signers and submit through a normal callable pipeline.
5. Read the resulting trustline through RPC.

## Important details

Reserve sponsorship and fee sponsorship solve different problems. The sponsor
assumes the trustline's minimum-balance reserve obligation; this example also
happens to use it as transaction source. The holder must still authorize
creation of its trustline. See [fee bumps](../fee-bump/README.md) for a distinct
outer fee payer.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
