# Load and call a contract

These examples introduce Colibri's generic `Contract` class using a small
counter. The [Rust source](./contract/src/lib.rs) defines a count, an increment
method, and an intentional error. Its compiled [Wasm](./contract/counter.wasm)
is included so you can start with TypeScript.

Uploading Wasm stores executable code on the network. Deploying creates a
contract instance with its own identity and state. Each lesson performs both
steps and uses a fresh Testnet instance.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/contract
```

Normal runs need Deno and Testnet access. Each script generates a deployer and
funds it with Friendbot; Rust and the Stellar CLI are only needed for
rebuilding.

## 1. Read and invoke with the specification

```sh
deno task counter
```

Follow [`counter.ts`](./counter.ts):

1. Read the Wasm and load its embedded specification, which describes the
   contract's methods and argument types.
2. Upload the code and deploy an instance.
3. Call `read` to simulate `count` without committing a transaction.
4. Call `invoke` with `increment` and `by: 3`, then read the count again.

Expect **0 before** and **3 after**, plus the confirmed invocation hash. The
specification supplies encoding information; the caller chooses read or invoke.

## 2. Work directly with XDR

```sh
deno task raw
```

[`raw-invocation.ts`](./raw-invocation.ts) supplies a native `ScVal` containing
a U32 to `invokeRaw`. It then decodes the `ScVal` returned by `readRaw`. This
path makes encoding explicit and finishes with a count of **2**.

## 3. Recognize a contract error

```sh
deno task error
```

[`known-error.ts`](./known-error.ts) loads error definitions from the Wasm and
calls the method that deliberately rejects. It catches and prints the named
contract error. The expected rejection is the lesson's successful outcome.

Errors are registered for this contract ID. Error number 1 in a different
contract can have a different meaning. The counter itself is permissionless; it
is a call/encoding fixture, not an authorization design.

## Optional: rebuild the contract

After changing the Rust source, rebuild the artifact with:

```sh
deno task contract:build
```

This needs Rust, the `wasm32v1-none` target, and a compatible Stellar CLI.
`Cargo.lock` pins dependencies, but compiler and build metadata can still change
the Wasm bytes. See [build verification](../build-verification/README.md) for
reproducing a specific artifact.

## Learn more

- [Generate a typed client](../contract-bindings/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
