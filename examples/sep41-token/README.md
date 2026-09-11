# Approve and spend a token allowance

SEP-41 defines a shared interface for Soroban tokens. `SEP41TokenContract` lets
you call that interface by contract ID without creating a client for each token
implementation.

This lesson deploys the included [token contract](./contract/src/lib.rs), then
shows how an owner authorizes a spender to move a limited amount on its behalf.
The compiled [Wasm](./contract/token.wasm) is ready to use.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/sep41-token
deno task allowance
```

The script creates an owner, spender, and recipient on Testnet and funds them
through Friendbot. Normal runs need Deno and network access, not a Rust build.

## Follow the allowance

Open [`allowance.ts`](./allowance.ts):

1. Deploy the fixture with **100 tokens** assigned to the owner by its
   constructor.
2. Bind `SEP41TokenContract` to the deployed contract ID and read its metadata,
   including decimal precision.
3. Have the owner sign `approve` for **10 tokens**, with an expiry 100 ledgers
   beyond the observed latest ledger.
4. Have the spender sign `transferFrom` to move **3 tokens** to the recipient.
5. Read the allowance and recipient balance again.

Expect **7 tokens of allowance** remaining and **3 tokens** in the recipient's
balance. The owner approves the limit; the spender authorizes using it. The
recipient does not sign either action.

## Units and contract policy

SEP-41 amounts are integers in the token's smallest units. This fixture uses
seven decimals, so one token is `1_0000000n`. The script reads the precision and
uses matching integer amounts; check that precision when adapting it to another
token. This custom contract token does not require a Stellar asset trustline.

Minting is not a SEP-41 method. Constructor issuance and the deliberately public
`mint_with_reference` extension belong to this demonstration contract. Its mint
policy is not suitable for production. The artifact also declares SEP-41
metadata, which you can inspect in the
[claims and interface lesson](../contract-metadata/README.md).

## Optional: rebuild the fixture

After changing the Rust source:

```sh
deno task contract:build
```

Rebuilding needs Rust, the `wasm32v1-none` target, and a compatible Stellar CLI.
The implementation is adapted from Colibri's purpose-built fixture using
Stellar's token library.

## Learn more

- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
- [Stellar token library](https://github.com/stellar/stellar-contracts)
- [Original Colibri fixture](https://github.com/fazzatti/colibri/tree/0b8225d3bcd8925f762b915fa5dc7a9d78572365/_internal/contracts/sep41-token)
