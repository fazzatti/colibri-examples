# SEP-10 Authentication Example

This example demonstrates how to authenticate with a Stellar anchor using the SEP-10 Web Authentication protocol via [@colibri/sep10](https://jsr.io/@colibri/sep10).

## Overview

SEP-10 allows wallets to prove ownership of a Stellar account to an anchor service without exposing the secret key. The protocol uses a challenge-response flow where the client signs a specially crafted transaction to prove control of the account.

The example showcases:

- Fetching and parsing an anchor's `stellar.toml` file
- Creating a SEP-10 client from the TOML configuration
- Completing the authentication flow to obtain a JWT
- Inspecting the JWT claims and using it for authenticated requests

## Usage

Before proceeding, make sure to follow the setup described in the [workspace README](../../README.md).

### Run the Example

```bash
deno task connect
```

This script:

1. Generates a random keypair (no funding required for SEP-10)
2. Fetches the `stellar.toml` from `testanchor.stellar.org`
3. Creates a SEP-10 client using the TOML's auth endpoint and signing key
4. Authenticates by requesting a challenge, signing it, and submitting it
5. Logs the resulting JWT token and its claims

## Key Concepts

### StellarToml (from @colibri/core)

Fetches and parses an anchor's `stellar.toml` file to discover SEP-10 configuration:

```ts
const stellarToml = await StellarToml.fromDomain("testanchor.stellar.org");

console.log(stellarToml.webAuthEndpoint); // Auth endpoint URL
console.log(stellarToml.signingKey); // Server's signing key
```

### Sep10Client (from @colibri/sep10)

High-level client that handles the full SEP-10 authentication flow:

```ts
const client = Sep10Client.fromToml(stellarToml, Networks.TESTNET);

const jwt = await client.authenticate({
  account: wallet.publicKey(),
  signer: wallet,
});
```

### JWT Token

The resulting JWT can be used to authenticate subsequent requests to the anchor:

```ts
// Use in Authorization header
const response = await fetch("https://anchor.example.com/sep24/deposit", {
  headers: {
    Authorization: `Bearer ${jwt.token}`,
  },
});

// Inspect claims
console.log(jwt.subject); // The authenticated account
console.log(jwt.homeDomain); // The anchor's home domain
console.log(jwt.expiresAt); // Token expiration time
```

## Learn More

- [@colibri/sep10 on JSR](https://jsr.io/@colibri/sep10)
- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [SEP-1 Specification (stellar.toml)](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md)
- [SEP-10 Specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
