# Generic Contract: Wasm, instances, calls, and errors

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Three independent scripts use a tiny public counter contract. Each uploads the
checked-in Wasm, deploys a fresh Testnet instance, and shows one Colibri
feature.

## Run

From the repository root:

```sh
cd examples/contract
deno task counter
deno task raw
deno task error
deno task contract:build
```

- `counter`: Read count=0, invoke increment(by=3), then read count=3.
- `raw`: Use native ScVal arguments with invokeRaw and decode readRaw's result.
- `error`: Load error names from the Wasm and catch the intentionally returned
  contract error.
- `contract:build`: Optional: rebuild the checked-in counter Wasm from the
  included Rust source.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Read Wasm bytes and load its embedded contract specification.
2. Upload code, then deploy an instance. These are different operations.
3. Use read for simulation only and invoke for confirmed state changes.
4. Use native SDK XDR directly when choosing the raw path.

## Important details

Running the TypeScript lessons needs Deno and Testnet access, not Rust or
Stellar CLI. Optional rebuilding needs a Rust toolchain with wasm32v1-none and a
compatible Stellar CLI (`stellar contract build`), not one exact global CLI
version. Cargo.lock pins dependencies. Build metadata/bytes can change with
toolchain versions; this is not the reproducible-build lesson. The counter is
deliberately permissionless. Error matching is scoped to its contract ID; it
does not globally assign every error #1 the same meaning.

Networked scripts use **Testnet only**, fresh disposable keys, and Friendbot
test XLM. Do not substitute production keys or a Mainnet configuration. Public
service availability and Testnet resets can affect runs.
