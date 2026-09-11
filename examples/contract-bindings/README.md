# Contract Bindings Example

This example demonstrates how to turn a Soroban contract into a TypeScript
package with
[@colibri/contract-bindings](https://jsr.io/@colibri/contract-bindings), then
use that package to interact with the contract on Testnet.

A compiled contract contains a specification describing its methods, types,
errors and events. Colibri reads this specification and generates a client that
knows how to encode arguments and decode results. You get typed calls and
contract-specific helpers without writing those definitions by hand.

## Overview

We will:

1. Explore the example counter contract.
2. Generate a local package from its compiled Wasm.
3. Inspect the package and its public exports.
4. Use it to construct values, read and invoke methods, handle errors and decode
   events.

The repository includes the contract and consumer scripts. **The package is
created by you during the lesson** and is ignored by Git.

## Usage

Follow the setup in the [workspace README](../../README.md), then open this
lesson's directory:

```sh
cd examples/contract-bindings
```

Use Deno 2.7.11 or newer. The compiled contract is included, so the walkthrough
needs no Rust, Docker or Stellar CLI. Package generation and value construction
run locally; the networked examples use disposable Testnet accounts funded by
Friendbot.

### 1. Explore the contract

Start with [contract/src/lib.rs](contract/src/lib.rs). The counter stores a
number that starts at zero and cannot exceed 100. Its declarations give the
generator several kinds of information to work with:

- `get_count`, `increment`, `summary` and `echo_summary` declare the callable
  methods and their inputs and outputs.
- `CounterSummary` and `CounterStatus` describe a custom struct and numeric
  enum.
- `CounterError` names the failures for a zero increment or exceeding the limit.
- `CountChanged` describes an event with an indexed `action` topic and the old
  and new counts as payload fields.

The compiled `contract/counter.wasm` contains these declarations in its embedded
specification. We can generate the package before deploying anything to a
network.

### 2. Generate the package

Read [generate-package.ts](generate-package.ts), then run:

```sh
deno task generate
```

The script loads the Wasm specification with `loadBindingSource`, prepares a JSR
package with `generateBindings`, and writes it with `writeBindings`. It chooses
`Counter` as the client class name and `@example/counter` as the package name.
The task formats the resulting files.

You now have a `package/` directory beside the scripts. Nothing is published to
JSR: this is a local package that you can inspect and use immediately.

### 3. Inspect what was generated

Open the new directory in your editor:

```text
package/
├── deno.json             Package name, exports and dependencies
├── mod.ts                Public entrypoint for the counter client
├── README.md             Contract-specific usage documentation
└── generated/
    ├── index.ts          Counter class and typed method conveniences
    ├── types.ts          Method types, custom-type factories and event fields
    ├── constants.ts      Method names, embedded specification and error map
    └── colibri.ts        Re-exported network, signer and value conveniences
```

Start at `mod.ts` and follow its exports. In `generated/index.ts`, look for
`getCount.read()` and `increment.invoke()`. In `generated/types.ts`, find the
`CounterSummary` type and factory. The errors and event types come from the
contract declarations you explored in step 1.

The lesson's [deno.json](deno.json) maps `@example/counter` to `package/mod.ts`
and `@example/counter/colibri` to its convenience exports. The consumer scripts
therefore import the package by name:

```ts
import { Counter, CounterSummary } from "@example/counter";
import { LocalSigner, NetworkConfig } from "@example/counter/colibri";
```

Check the generated package independently, then check its consumers:

```sh
deno task --cwd package check
deno task check
```

Generate first: these local import paths do not exist in a fresh checkout. The
repository-wide `deno task check` also performs generation before checking
sources.

### 4. Construct custom values

Run the offline example first:

```sh
deno task values
```

[values.ts](values.ts) constructs a `CounterSummary`, encodes it to an ScVal and
decodes it back. Look for count `7` and status `1` (`CounterStatus.Counting`).
`CounterSummary` names both a plain TypeScript type and its runtime factory;
`CounterSummaryArgs` describes what that factory accepts.

### 5. Read and invoke methods

```sh
deno task calls
```

[calls.ts](calls.ts) funds a signer, uploads the Wasm and deploys a fresh
counter. It reads the initial count, simulates an increment, then commits an
increment. Compare the output: simulation returns `3` while storage stays `0`;
invocation changes storage to `3`. The script also uses a typed generic call and
passes a custom summary into `echoSummary`.

Every method offers both `.read()` and `.invoke()` because the spec cannot
identify which methods change state. Choose the behavior you need. Invocation
keeps `methodArgs`, `config` and optional `auth` together in one object.

### 6. Handle errors and decode events

```sh
deno task errors
deno task events
```

[errors.ts](errors.ts) customizes an error message before constructing its
client. Calling `increment(0)` fails during simulation: the match contains
`InvalidIncrement`, its `CounterError` category and the custom message. Reading
the count confirms that it remains `0`.

[events.ts](events.ts) invokes an increment of five, filters for the indexed
`action` topic, then decodes `CountChanged`. Look for `increment` and `0 -> 5`.
Only indexed fields are filterable; the count fields are decoded from the
payload. If indexing is delayed, retry the event query rather than submitting
another increment.

Each networked script deploys its own instance, so these examples can be run
independently after package generation.

## Try another generation target

The CLI can generate an npm package from the same contract:

```sh
deno task generate:npm
cd ../../.output/contract-bindings/npm-counter
npm install
npm run build
```

This optional task uses a separate ignored output directory and requires Node
22.12 or newer. Its `.npmrc` resolves Colibri through the JSR npm registry. The
Deno consumers above continue to use the local `package/` from step 2.

You can also generate from a contract ID or Wasm hash and a network, or use the
CLI's interactive prompts. See the
[bindings guide](https://fifo-docs.gitbook.io/colibri/packages/contract-bindings)
for those options.

## Learn more

- [Bindings guide](https://fifo-docs.gitbook.io/colibri/packages/contract-bindings)
- [Bindings API reference](https://jsr.io/@colibri/contract-bindings/doc)
- [Generic contract example](../contract/README.md)

To rebuild after editing the Rust contract, install a compatible Stellar CLI,
Rust and the `wasm32v1-none` target, then run `deno task contract:build` and
`deno task generate`. Regeneration replaces client files and preserves package
scaffolds such as `mod.ts`, `deno.json` and `README.md` for your customizations.
The counter is adapted from Colibri's public
[bindings fixture](https://github.com/fazzatti/colibri/blob/e3ad712845eb262815c4e6db13abdcd186dcec4d/_internal/contracts/bindings-demo/src/lib.rs)
under the included [MIT license](contract/LICENSE).
