# SEP-41 allowance and delegated spending

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Deploy a custom token, then bind `SEP41TokenContract` to its standard interface.
The implementation is adapted from Colibri's purpose-built SEP-41 fixture using
Stellar's open-source token library.

## Run

From the repository root:

```sh
cd examples/sep41-token
deno task allowance
deno task contract:build
```

- `allowance`: Owner approves 10 tokens; spender transfers 3 to a recipient;
  inspect the remaining allowance.
- `contract:build`: Optional: rebuild token.wasm from contract/src/lib.rs.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Deploy with the owner as constructor recipient of the initial 100 tokens.
2. Bind the generic SEP-41 client by contract ID.
3. Read decimals and express amounts in that token's smallest units.
4. Have owner sign approve with an explicit ledger expiry.
5. Have spender sign transferFrom, then read allowance=7 tokens and recipient
   balance=3 tokens.

## Important details

No recipient trustline is needed for this custom contract token. Mint is not a
SEP-41 method: constructor issuance and the deliberately public
mint_with_reference extension belong to this demonstration contract. Do not use
its mint policy in production. The contract also declares SEP-41 metadata for
the separate [claims/interface lesson](../contract-metadata/README.md).
Rebuilding needs Rust + wasm32v1-none + a compatible Stellar CLI; running uses
the checked-in Wasm.
[Stellar token library](https://github.com/stellar/stellar-contracts) and
[Colibri fixture](https://github.com/fazzatti/colibri/tree/0b8225d3bcd8925f762b915fa5dc7a9d78572365/_internal/contracts/sep41-token)
are the source references.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
