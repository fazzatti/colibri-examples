# SEP-29 memo-presence guard

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Show the success and rejection paths of `@colibri/plugin-sep29` against a
disposable destination that advertises `config.memo_required`.

## Run

From the repository root:

```sh
cd examples/memo-required
deno task payment
deno task missing
```

- `payment`: Configure the recipient, then send a payment with native `Memo.id`.
- `missing`: Configure a different recipient, then catch the unique missing-memo
  error before submission.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Set the destination's account data explicitly.
2. Attach `createSep29Plugin` to the callable payment pipeline.
3. Supply a native Stellar SDK Memo, or deliberately omit it in the rejection
   lesson.
4. Print the confirmed hash or inspect the specific Colibri error.

## Important details

SEP-29 is a client convention, not a consensus memo requirement. The plugin
checks presence; it does not prove that a supplied memo identifies the correct
exchange customer. Muxed destinations carry their routing ID separately. No
external exchange account or real funds are used.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
