# Contract Build Verification

This example uses
[`@colibri/build-verification`](https://jsr.io/@colibri/build-verification) to
rebuild a Soroban Hello World contract and prove whether the rebuilt Wasm is
byte-for-byte identical to a known target.

It uses the same public fixture as Colibri's own integration suite:

- target: a checked-in 626-byte Hello World Wasm;
- source: the open-source
  [`stellar/soroban-examples`](https://github.com/stellar/soroban-examples)
  repository at commit `13b9f51d184aabde23dec820e44eed056cf9690f`;
- build environment: one digest-pinned Stellar CLI container image; and
- build command: the exact arguments used to produce the target.

The target is built from the Apache-2.0-licensed Stellar Soroban examples. The
upstream license is preserved beside the Wasm in
[`contract/LICENSE-APACHE-2.0.txt`](./contract/LICENSE-APACHE-2.0.txt).

The example intentionally uses an immutable commit rather than a branch or a
mutable image tag. Reproducible verification is only meaningful when every input
that can affect the Wasm bytes is fixed.

## What Colibri Does

For every runnable path, Colibri:

1. reads the target Wasm from
   [`contract/hello-world.wasm`](./contract/hello-world.wasm);
2. resolves the GitHub revision to the exact commit;
3. downloads the commit archive and verifies its SHA-256 digest;
4. validates the digest-pinned Stellar CLI image;
5. extracts the source into a disposable workspace;
6. rebuilds `soroban-hello-world-contract` in a bounded Docker container;
7. selects the new Cargo release artifact without guessing; and
8. compares the rebuilt and target Wasm bytes.

A successful result means those exact source, image, and build inputs reproduced
the target bytes. It does not mean the source code is safe or audited.

## Prerequisites

Follow the installation instructions in the [workspace README](../../README.md),
then enter this example:

```bash
cd examples/build-verification
```

You also need:

- a running Docker daemon; and
- outbound network access for the GitHub archive, image registry, and Cargo
  dependencies used by this public source.

The first run can take several minutes while Docker pulls the pinned image and
Cargo downloads dependencies. Later runs normally reuse the local image cache.

## 1. TypeScript API with a GitHub Source

Run the complete, commented TypeScript example:

```bash
deno task verify:github
```

The implementation in [`verify-from-github.ts`](./verify-from-github.ts) keeps
every public Colibri call visible. It constructs a `ContractBuildVerifier`,
provides the direct Wasm target, immutable GitHub source, and caller-supplied
recipe, then writes the completed evidence and logs.

This target predates embedded SEP-58 build metadata, so the example explicitly
uses `outOfBand` mode. The evidence records that the recipe came from the caller
rather than from the deployed Wasm itself.

## 2. CLI Directly from JSR

The same verification can run through Colibri's CLI without installing the
package or cloning the Colibri SDK:

```bash
deno run -A jsr:@colibri/build-verification@0.3.0/cli \
  --wasm ./contract/hello-world.wasm \
  --github-owner stellar \
  --github-repository soroban-examples \
  --github-revision 13b9f51d184aabde23dec820e44eed056cf9690f \
  --recipe ./recipe.json \
  --allow-build-network
```

The version is pinned in this command so the CLI implementation is as explicit
as the build inputs. Deno downloads the published JSR package into its cache for
the run; it does not add the package to this project.

For convenience, the same command is available as:

```bash
deno task verify:cli
```

On an interactive terminal, the CLI displays a stage-aware verification spinner
on standard error while the build is running, then clears it before printing one
concise result line on standard output. Pass `--quiet` when progress should be
suppressed. A successful rebuild of this fixture prints:

```text
VERIFIED ba789fe6627de52ebfbd5353f5eb6b7efef23d7e8633ab59051c1a22b2f00a88
```

This path does not create evidence or log files. It is useful for an immediate
human-readable answer while preserving machine-friendly exit codes:

- `0` when the rebuilt Wasm is verified;
- `1` when verification or reporting could not complete;
- `2` for a completed build whose Wasm differs; and
- `3` when verification is not applicable.

## 3. Complete JSON, Evidence, and Logs

Run the file-producing CLI variant when you need the complete machine-readable
result and durable verification artifacts:

```bash
deno task verify:cli:files
```

This task adds `--json` for the complete result on stdout, `--evidence` for the
structured evidence document, and `--logs` for the bounded execution log.
Machine-readable JSON mode disables the interactive spinner automatically. These
reporting flags are independent: a real integration can request only the outputs
it needs.

## Evidence and Logs

The TypeScript example and the file-producing CLI variant write their outputs
under `.verification/`, which is ignored by Git:

- `*-evidence.json` records resolved source, image, recipe, artifact, execution,
  and comparison facts; and
- `*-logs.jsonl` records the bounded stage logs.

Neither output contains source archives, Wasm bytes, URL credentials, GitHub
tokens, or environment-variable values.

## Why Build Networking Is Explicit

Colibri disables network access inside build containers by default. This source
does not vendor its Cargo dependencies, so the example passes
`allowBuildNetwork: true` in TypeScript and `--allow-build-network` in the CLI.

Only enable this for source and build inputs you intentionally trust. Container
isolation reduces risk, but the build still executes third-party code and shares
the host kernel.

## Applying the Flow to Another Contract

For an older contract without SEP-58 metadata, replace all four coupled inputs
together:

1. the target Wasm;
2. the immutable source and its exact archive digest;
3. the digest-pinned build image; and
4. the ordered build arguments and options.

For a SEP-58 contract, omit the caller-supplied recipe and let the Wasm metadata
provide the authoritative build image, arguments, options, and source digest.
Deployed contracts can be targeted with `contractId` plus a Colibri
`NetworkConfig`, or through the CLI with `--contract-id` and `--network`.

## Learn More

- [@colibri/build-verification on JSR](https://jsr.io/@colibri/build-verification)
- [SEP-58: Contract build information](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0058.md)
- [Stellar Soroban examples](https://github.com/stellar/soroban-examples)
- [Colibri repository](https://github.com/fazzatti/colibri)
