# StellarAsset: native asset operations

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Use the `StellarAsset` class to submit native asset operations through its owned
transaction pipeline. This complements the SAC and SEP-41 examples; it does not
turn a native asset into a token contract.

## Run

From the repository root:

```sh
cd examples/stellar-asset
deno task lifecycle
deno task authorization
deno task clawback
```

- `lifecycle`: Create trustlines, mint 100 DEMO to Alice, transfer 25 to Bob,
  and burn 5 from Bob.
- `authorization`: Enable issuer authorization policy, create an initially
  unauthorized trustline, authorize it, mint, and revoke transfer authorization.
- `clawback`: Enable clawback before trustline creation, mint 10 units, and claw
  back 3 as the issuer.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Every script creates its own disposable accounts and issuer+code asset
   identity.
2. Trustline creation is explicit, not hidden in mint or transfer.
3. Issuer-signed mint and holder-signed burn are payments with different
   sources/destinations.
4. Read confirmed balances or authorization state through the class.

## Important details

`lifecycle` finishes with Alice holding 75 DEMO and Bob 20. `clawback` finishes
with 7 RECALL. Native asset decimal amounts have seven decimal places; raw
balances are bigint smallest units. Policy flags apply to the issuer account and
have consequences beyond one transfer. `setAuthorized(false)` preserves
authorization to maintain liabilities; it is not a universal freeze. Clawback is
intentionally separate from voluntary burn. For SAC deployment and invocation,
see
[the existing SAC asset lesson](../../getting-started/issue-asset/README.md).

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
