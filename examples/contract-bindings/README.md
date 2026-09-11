# Generated contract bindings

[Bindings guide](https://fifo-docs.gitbook.io/colibri/packages/contract-bindings)
· [API reference](https://jsr.io/@colibri/contract-bindings/doc) ·
[Example index](../../README.md)

Generate a typed client from a small Soroban counter, then use its methods,
custom values, error map and event definitions. The compiled contract and
generated client are checked in: you can read and run the examples immediately.

## Run

Use Deno 2.7.11 or newer. From the repository root:

```sh
deno install
cd examples/contract-bindings
deno task values
deno task calls
deno task errors
deno task events
```

| Command  | What to look for                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `values` | Offline struct/enum construction, mixed raw and validated inputs, and an XDR round trip.                                                         |
| `calls`  | A simulated increment returns 3 while storage stays 0; invoking commits 3. Typed generic calls and a custom struct argument use the same client. |
| `errors` | `increment(0)` fails in simulation with the generated name/category and a customized message; storage stays 0.                                   |
| `events` | A confirmed increment emits `CountChanged`; an indexed filter retrieves it and typed decoding reports `0 -> 5`.                                  |

Each networked script independently funds a disposable signer and deploys a
fresh **Testnet** counter. They need neither environment variables nor a
previous lesson's contract ID. No Mainnet transactions are submitted. Normal
runs need no Docker, Rust or Stellar CLI.

## Generate the client yourself

The CLI task uses the checked-in Wasm and an explicit class name:

```sh
deno task generate
```

This runs the released `@colibri/contract-bindings@0.1.0/cli` with
`--wasm ./contract/counter.wasm --class-name Counter --output files`. `--force`
regenerates the five files in `generated/`; keep handwritten lessons outside
that directory. Without `--non-interactive`, the CLI can prompt for source,
network and output choices.

| Generated file                         | Exports / purpose                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [index.ts](generated/index.ts)         | `Counter`, with typed `.read()` / `.invoke()` properties and generic calls.                                         |
| [constants.ts](generated/constants.ts) | `ContractMethods`, `CounterSpec` and `CounterErrors`.                                                               |
| [types.ts](generated/types.ts)         | Method inputs/outputs, `CounterSummary` and `CounterStatus` types/factories, event fields and client configuration. |
| [colibri.ts](generated/colibri.ts)     | Original Core conveniences such as `NetworkConfig`, `LocalSigner`, `SorobanType` and `TransactionConfig`.           |
| [README.md](generated/README.md)       | Contract-specific method names and usage.                                                                           |

To generate from an existing deployment instead, set `CONTRACT_ID` to the
address printed by `calls` and run:

```sh
deno run --allow-read --allow-write --allow-net \
  jsr:@colibri/contract-bindings@0.1.0/cli \
  --contract-id "$CONTRACT_ID" --network testnet --class-name Counter \
  --output files --out ../../.output/contract-bindings/from-network --force --non-interactive
```

A Wasm hash uses `--wasm-hash` instead of `--contract-id`, on the network where
the code was uploaded. See the guide for custom RPCs and network passphrases.

## Generate a package

[generate-package.ts](generate-package.ts) shows the three separate API calls:
`loadBindingSource`, `generateBindings`, then `writeBindings`. It opts into
Wasm-hash provenance; the normal file-generation task leaves provenance out.

```sh
# Programmatic JSR package generation, then type-check its exports.
deno task generate:package
deno task --cwd ../../.output/contract-bindings/jsr-counter check

# CLI npm package generation, then compile JavaScript and declarations.
deno task generate:npm
cd ../../.output/contract-bindings/npm-counter
npm install
npm run build
```

The generated packages use the placeholder name `@example/counter`. These
commands do not publish anything. Node 22.12 or newer is required for npm; its
generated `.npmrc` configures the JSR npm registry. Outputs live in the ignored
repository-level `.output/contract-bindings/` directory, outside the lesson's
source paths. The JSR example declares its own workspace for independent
checking. Regeneration preserves existing package scaffolds.

## Important details

- This lesson declares Bindings 0.1.0 and compatible **Core 1.1** dependencies
  in its own workspace configuration. The lockfile fixes the versions used.
- The spec does not identify reads versus writes. Every method offers both;
  choose `.invoke({ methodArgs, config, auth? })` when state should be
  committed. `get_count` becomes `getCount`, while generic method strings keep
  ABI spelling.
- `CounterSummary` is both a decoded-value type and a runtime factory.
  `CounterSummaryArgs` describes factory inputs; `EchoSummaryInput` describes
  the method's complete argument object. Decoded outputs remain ordinary values.
- The counter is deliberately permissionless and capped at 100. Signing pays for
  its transactions; this is not an access-control example. See the
  [Rust source](contract/src/lib.rs) for the rules, errors and event
  declaration.
- Expected contract failures are handled explicitly. Network failures still stop
  the script. If an event has not been indexed, retry the query rather than the
  increment. A post-success `CONTR_021` decoding error likewise retains the
  successful transaction; inspect it before deciding whether to submit again.

For optional Wasm rebuilding, install a compatible Stellar CLI, Rust and the
`wasm32v1-none` target, then run `deno task contract:build` followed by
`deno task generate`. Cargo.lock pins the Rust dependencies. The counter is
adapted from Colibri's public
[bindings fixture](https://github.com/fazzatti/colibri/blob/e3ad712845eb262815c4e6db13abdcd186dcec4d/_internal/contracts/bindings-demo/src/lib.rs)
under the included [MIT license](contract/LICENSE).
