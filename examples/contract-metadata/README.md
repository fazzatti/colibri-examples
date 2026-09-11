# Inspect contract claims and interfaces

A contract can declare that it follows a standard. Its specification also lets
you inspect whether its methods have the required names and types. These answer
different questions, so this example keeps the two inspections separate.

Both scripts read the [SEP-41 token Wasm](../sep41-token/contract/token.wasm)
already included in the repository. You do not need to deploy it or run the
token lesson first. After dependencies are installed, inspection is entirely
offline.

## Setup

Follow the [workspace setup](../../README.md), then enter this directory:

```sh
cd examples/contract-metadata
```

## Read the author's claims

```sh
deno task claims
```

[`claims.ts`](./claims.ts) extracts SEP-46 metadata from the Wasm, reads its
SEP-47 declarations, and asks whether the author declares SEP-41. Expect that
claim to be **true**. This reports what the artifact says about itself.

## Check the interface

```sh
deno task interface
```

[`interface.ts`](./interface.ts) extracts the embedded specification and
compares it with Colibri's bundled SEP-41 definition. Read the overall match
alongside the lists of missing, incompatible, and extra functions.

The fixture **matches**, with no missing or incompatible methods. Its
constructor and `mint_with_reference` extension appear as additional methods.
Here, `latest` selects the standard version bundled in the installed Colibri
package; it does not fetch a definition from the internet.

## What these results establish

A claim records author intent, and a match establishes the inspected ABI shape.
Neither establishes how authorization or accounting behaves when the methods
run. For a separate source-to-Wasm comparison, see
[build verification](../build-verification/README.md).

## Learn more

- [Use the SEP-41 interface](../sep41-token/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
