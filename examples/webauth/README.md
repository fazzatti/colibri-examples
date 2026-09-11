# WebAuth: SEP-10 and SEP-45

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/packages/webauth) ·
[Example index](../../README.md)

These examples use `WebAuthClient` to obtain a JWT after proving account
authorization. SEP-10 uses a keypair-backed account and a transaction-shaped
challenge. SEP-45 uses a contract account and Soroban authorization entries.
Neither login flow submits a payment.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/webauth
```

Both lessons need network access. SEP-10 talks to a public Testnet anchor;
SEP-45 deploys its own Testnet fixtures and starts a local HTTP server.

## SEP-10: a keypair account

```sh
deno task sep10
```

Follow [`sep10.ts`](./sep10.ts). It generates an unfunded signer, discovers the
public testanchor.stellar.org TOML, requests and validates a challenge for that
account, signs it, and exchanges it for a JWT. The script prints JWT claims, not
the bearer credential itself.

The public test anchor currently needs an `Accept: */*` override for TOML
retrieval. That compatibility adapter is local to this domain. Other servers
should use the default client behavior unless they require an explicit
adjustment. Availability and authentication policy belong to that external
anchor.

## SEP-45: a custom contract account

```sh
deno task sep45
```

Follow [`sep45.ts`](./sep45.ts). All client and authorization steps are in this
file:

1. Generate a software P-256 credential.
2. Deploy the demonstration verification/account contracts to Testnet using
   `deploy-testnet.ts`, then start a localhost HTTP fixture.
3. Construct `WebAuthClient` from the fixture's TOML.
4. Call `client.sep45.authenticate` with the contract account and an explicit
   authorization callback.
5. Build the account-specific signing preimage, construct the WebAuthn-shaped
   assertion, sign it, and return the complete immutable authorization entry.
6. Receive JWT claims and always stop the local server.

Expect decoded JWT claims after successful authentication. The bearer token is
deliberately kept out of the terminal output.

The callback preserves the credential version, nonce, and invocation tree.
SEP-45 v0.1.1 requires legacy address credentials. Current RPC may record V2, so
the server fixture chooses the required legacy format BEFORE any signatures are
made. Never convert an already signed entry: the version changes its preimage.
Colibri checks the known SEP-45 challenge shape, while the contract's custom
`__check_auth` validates this particular assertion format.

### What is fixture setup?

- [`deploy-testnet.ts`](./deploy-testnet.ts): deployer funding, Wasm
  upload/instance creation, server startup.
- [`server.ts`](./server.ts): local SEP-45-only HTTP counterpart, challenge
  nonce tracking, verification simulation, and short-lived JWT issuance.
- `contracts/`: checked-in Rust sources, Wasm artifacts, and specifications.

No Docker is needed. Normal runs use the committed Wasm and do not rebuild it.
Both contracts are on Testnet; only the HTTP service is local.

### Not a browser passkey implementation

The P-256 key and WebAuthn assertion are synthesized with WebCrypto to make the
custom account flow inspectable in one terminal script. There is no hardware
authenticator, browser-origin ceremony, secure credential storage, or production
replay database here. A real wallet delegates to its authenticator and
implements its own account policy. The localhost HTTP exception must not be
copied to a production service.

## Routing and artifacts

`client.authenticate(...)` can route by account type; the lessons intentionally
use `client.sep10` and `client.sep45` so the chosen protocol is obvious.
Unsupported options are not silently sent through a fallback protocol.

Optional rebuild/byte check:

```sh
deno task contract:build
deno task contract:check
```

These need Rust + wasm32v1-none and a compatible Stellar CLI. Cargo dependencies
are pinned; an exact-byte check can also depend on the original compiler/CLI
build metadata. This does not restrict the globally installed CLI for running
the authentication scripts. Rebuilding refreshes artifacts/specs together.

## Learn more

- [Colibri WebAuth documentation](https://fifo-docs.gitbook.io/colibri/packages/webauth)
- [Offline message signatures](../message-signing/README.md)
