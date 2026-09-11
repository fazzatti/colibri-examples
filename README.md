# Colibri examples

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[SDK source](https://github.com/fazzatti/colibri) ·
[Published packages](https://jsr.io/@colibri)

Runnable, commented lessons for Colibri and Stellar. Each script shows the
actual SDK calls, account roles, and transaction steps. Start with one file and
its README. Variants are separate commands, not branches in a large demo runner.

## Run a lesson

Install Deno 2.7.11 or newer, clone this repository, then:

```sh
deno install
cd getting-started/native-payment
deno task payment
```

Transaction and authentication lessons use **Testnet**, disposable generated
keys, and Friendbot test XLM where funding is needed. The existing
event-streamer lessons only READ public Mainnet data and never sign or submit
transactions. Do not insert production keys or replace Testnet with Mainnet.
Public endpoints and Testnet state may change or reset.

Contract lessons include Wasm artifacts, so normal runs need no Rust or Stellar
CLI. Rebuild commands are optional and require Rust, the wasm32v1-none target,
and a compatible Stellar CLI. Docker is needed only for the local-ledger and
build-verification lessons, not for delegated signers or SEP-45.

Dependencies are declared by the Deno workspace and locked in deno.lock. Each
lesson records its required Colibri versions; generated bindings use Core 1.1.
The examples use Stellar JS SDK 17. Keep native SDK objects such as Operation,
Asset, Memo, Spec, and XDR values visible at the integration boundary.

## Start here

| Lesson                                                              | What you learn                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Native payment](getting-started/native-payment/README.md)          | Native operations, a callable pipeline, configuration, confirmed outcomes                              |
| [Generic contract](examples/contract/README.md)                     | Wasm versus instances, spec loading, simulated reads, committed writes, raw XDR, named contract errors |
| [Generated contract bindings](examples/contract-bindings/README.md) | Generate and inspect a package, then use typed calls, custom values, errors and events                 |
| [SAC transfer](getting-started/contract-transfer/README.md)         | Transfer XLM through its Stellar Asset Contract                                                        |
| [SAC asset issuance](getting-started/issue-asset/README.md)         | Native trustline setup plus contract-backed minting                                                    |
| [Handling errors](getting-started/handling-errors/README.md)        | Identify a Colibri error and inspect diagnostic metadata                                               |

## Assets and native markets

| Lesson                                                     | Independent commands / concepts                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [StellarAsset](examples/stellar-asset/README.md)           | Mint/transfer/burn; issuer authorization; clawback                   |
| [SEP-41 token](examples/sep41-token/README.md)             | Approve an allowance, then transfer as the spender                   |
| [SDEX](examples/sdex/README.md)                            | Sell and buy offer lifecycles; explicit price units and exact ratios |
| [Liquidity pool](examples/liquidity-pool/README.md)        | Share trustline, labelled deposit, position, bounded withdrawal      |
| [Claimable balances](examples/claimable-balance/README.md) | Recipient claim before expiry; sender refund afterward               |

Market lessons use a freshly issued asset and explicit limits. They do not
discover prices, index an order book, or choose financial policies for users.

## Transaction configuration and composition

| Lesson                                                        | What you learn                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Fees](examples/fees/README.md)                               | Per-operation base, exact inclusion, Soroban total cap; bid versus actual charge |
| [Fee bump](examples/fee-bump/README.md)                       | Separate payment authority from the outer fee payer                              |
| [Channel accounts](examples/channel-accounts/README.md)       | Independent sequence numbers; a separate advanced fee-bump/muxed composition     |
| [Reserve sponsorship](examples/reserve-sponsorship/README.md) | Explicit native begin/end sponsorship and trustline ownership                    |
| [SEP-29 memo guard](examples/memo-required/README.md)         | Native Memo plus opt-in pre-submission memo-presence checks                      |

Pipelines are callable:
`const sendPayment = createClassicTransactionPipeline(...)`, then
`await sendPayment(...)`. Attach plugins with `sendPayment.use(...)` and
continue using the original callable.

## Authorization and authentication

| Lesson                                                                            | What you learn                                                             |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Delegated signers](examples/delegated-signers/README.md)                         | Direct, recursive, deeply nested, and branching Soroban authorization      |
| [Hash-X](examples/hash-x-signer/README.md)                                        | Require a preimage in addition to normal transaction authorization         |
| [Signed payload](examples/signed-payload-signer/README.md)                        | D reveals the signature needed for a separately finalized C                |
| [Preauthorized transaction](examples/pre-authorized-transaction-signer/README.md) | Install one exact transaction hash and verify one-shot removal through RPC |
| [WebAuth](examples/webauth/README.md)                                             | SEP-10 account login; SEP-45 custom contract-account login                 |
| [Message signing](examples/message-signing/README.md)                             | Offline SEP-53 signature verification                                      |

These demonstrate protocol primitives, not complete custody, multisig, exchange,
or production authentication policies.

## Inspection, ingestion, and local tooling

| Lesson                                                          | What you learn                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Local test ledger](examples/stellar-test-ledger/README.md)     | Direct Docker-backed test setup, plus optional reusable-ledger/logging tasks       |
| [Build verification](examples/build-verification/README.md)     | GitHub out-of-band rebuild, strict SEP-58 Testnet target, JSR CLI summary/evidence |
| [Contract metadata](examples/contract-metadata/README.md)       | Declared SEP claims versus independent structural interface matching               |
| [Event streamer](examples/event-streamer/README.md)             | Live and archived Soroban event ingestion                                          |
| [Transaction streamer](examples/transaction-streamer/README.md) | Finite transaction and successful native-payment slices                            |
| [Identicon](examples/identicon/README.md)                       | Offline deterministic SVG/PNG rendering                                            |

## Validate examples

```sh
deno task check
deno task lint
deno task fmt:check
```

These commands validate source files; they do not submit transactions. To
exercise behavior, run the individual lessons. Only the local-test-ledger
subproject has tests because that lesson is explicitly about testing.

## Contributing a lesson

Keep one learning objective per file. Declare ordinary configuration and signer
values in the lesson, call Colibri directly, and comment on both **what
happens** and **why Stellar requires it**. A small deployment helper is
acceptable; a shared wrapper that hides the feature being taught is not. Keep
genuine validation and cleanup guards, separate independent variants, and
document expected results and limitations. Never commit private keys or
generated JWTs.

Write for someone learning both Stellar and Colibri:

- Place explanations **before** the line or block they describe. Use an
  end-of-line comment only for a short annotation. Do not put explanatory
  comments after the action.
- Leave one blank line between conceptual steps, including inside callbacks.
  Keep related fields and declarations together so spacing reflects the lesson,
  not every individual line of syntax.
- Name intermediate values when they explain a distinction: an offer effect
  versus an offer entry, raw balance units versus display text, or an
  authorization preimage versus its signature. Keep the native SDK types.
- Prefer a linear flow and short guards to nested conditionals. Use try/catch
  for the error being taught and try/finally for required cleanup; do not hide
  the workflow in helpers or promise chains just to make the entrypoint shorter.
