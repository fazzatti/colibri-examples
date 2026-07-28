# Unified WebAuth Example

This example demonstrates the two explicit authentication paths exposed by
[`@colibri/webauth`](https://jsr.io/@colibri/webauth):

- SEP-10 for classic `G...` accounts
- SEP-45 for Soroban contract `C...` accounts

Both paths use `WebAuthClient`, but their challenges and authorization
mechanisms remain intentionally separate.

## Setup

Follow the installation instructions in the [workspace README](../../README.md),
then enter this directory:

```bash
cd examples/webauth
```

The SEP-45 example also requires:

- Rust with the `wasm32v1-none` target
- Stellar CLI `26.1.0`
- Internet access to Stellar Testnet and Friendbot

## SEP-10

Run:

```bash
deno task sep10
```

The script creates an unfunded random classic account, discovers the Stellar
Test Anchor configuration, explicitly selects `client.sep10`, signs its
transaction challenge, and prints the resulting JWT claims.

SEP-10 proves control of a classic account through transaction signatures. The
account does not need to be funded for this authentication flow.

## SEP-45

Run:

```bash
deno task sep45
```

The command:

1. Builds the example contracts and their TypeScript specs.
2. Creates and funds a temporary deployer through Testnet Friendbot.
3. Deploys the SEP-45 WebAuth verification contract to Stellar Testnet.
4. Generates an in-memory P-256 credential.
5. Deploys a custom account initialized with that credential's public key to
   Testnet.
6. Starts a local server advertising SEP-45 in its `stellar.toml`.
7. Explicitly authenticates through `client.sep45`.
8. Uses a full-entry authorization handler to attach a WebAuthn-shaped
   assertion.
9. Performs enforcing RPC simulation before submitting the challenge.

The custom account is deliberately small and educational. It mirrors Colibri's
internal passkey fixture by checking:

- the relying-party ID hash
- user-presence and user-verification flags
- the WebAuthn client-data type, origin, and authorization-entry challenge
- a low-S P-256 signature over the authenticator and client data

It is not a production passkey wallet. Production contracts need credential
registration, rotation and recovery policies, replay considerations, origin
management, auditing, and a carefully designed upgrade strategy.

The local server signs its educational JWTs with an ephemeral in-memory HMAC key
so the example can show the complete client flow without introducing persistent
server-key management. Production WebAuth services need durable key management
and JWT validation appropriate to their deployment.

Each run deploys fresh example contracts to Testnet. The local WebAuth server
stops when the script finishes, while the deployed contracts remain on the
public test network.

## Automatic Routing

The unified façade can select the correct protocol from the account type:

```ts
const classicJwt = await client.authenticate({
  account: classicAccount.publicKey(),
  signer: classicAccount,
});

const contractJwt = await client.authenticate({
  account: contractAccount,
  authorize: credential.authorize,
});
```

`WebAuthClient` routes `G...` accounts only to SEP-10 and `C...` accounts only
to SEP-45. It never falls back to the other protocol after choosing a route.

## Reproducible Contract Artifacts

```bash
deno task contract:check
```

This rebuilds both contracts with the pinned toolchain and verifies that their
WASM artifacts and generated TypeScript specs match the checked-in files.

## Learn More

- [WebAuth package](https://jsr.io/@colibri/webauth)
- [SEP-10 specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [SEP-45 specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0045.md)
- [Colibri repository](https://github.com/fazzatti/colibri)
