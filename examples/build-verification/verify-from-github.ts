/**
 * Example: Rebuild and verify a Soroban Hello World contract from GitHub.
 *
 * Build verification does more than compile source code. It must reproduce the
 * exact Wasm bytes of a known target. This example therefore fixes every input
 * that can affect those bytes:
 *
 * 1. the target is a checked-in Hello World Wasm;
 * 2. the source is one immutable `stellar/soroban-examples` commit;
 * 3. the source archive has a known SHA-256 digest;
 * 4. the build uses one digest-pinned Stellar CLI container image; and
 * 5. the original ordered build arguments are replayed exactly.
 *
 * Colibri downloads the GitHub archive, validates its digest, rebuilds the
 * contract in a disposable Docker container, selects the resulting artifact,
 * and compares its raw bytes with the checked-in target.
 */
import {
  ContractBuildVerifier,
  writeVerificationEvidence,
  writeVerificationLogs,
} from "@colibri/build-verification";
import chalk from "chalk";

console.log(chalk.bgBlue("Colibri contract build verification example"));

/**
 * The GitHub source is pinned to a commit rather than a branch. A branch such as
 * `main` can move after the target contract was built, while a commit identifies
 * one exact source tree.
 *
 * The archive hash covers the bytes GitHub serves for this commit. Verifying it
 * prevents a different archive from silently becoming the build input.
 */
const source = {
  type: "githubArchive" as const,
  owner: "stellar",
  repository: "soroban-examples",
  revision: "13b9f51d184aabde23dec820e44eed056cf9690f",
  format: "tarGzip" as const,
};

/**
 * This Hello World Wasm predates embedded SEP-58 metadata, so the example uses
 * Colibri's explicit out-of-band mode. The recipe is caller-supplied and is
 * recorded as such in the evidence.
 *
 * The image is pinned by manifest digest. A mutable image tag would not be
 * reproducible because its contents can change while the tag stays the same.
 */
const recipe = {
  image:
    "docker.io/stellar/stellar-cli@sha256:ccdebe3bd4af47e01f275c3da6caeb2752d02b06bc8bc1b3db534432498810c0",
  arguments: ["contract", "build"],
  options: [
    "--locked",
    "--manifest-path=hello_world/Cargo.toml",
    "--package=soroban-hello-world-contract",
    "--optimize",
  ],
  sourceSha256:
    "99914f1ae0c24483e5269026954be74532976cf3182ff4a30c196f826f53aa5d",
};

/**
 * Direct Wasm targets do not need a Stellar network or RPC endpoint. The target
 * bytes are already present in this example, while the source comes from the
 * immutable GitHub revision above.
 */
const targetWasm = await Deno.readFile(
  new URL("./contract/hello-world.wasm", import.meta.url),
);

/**
 * The source uses crates that are not vendored in the repository, so the build
 * container needs outbound network access to obtain them. Colibri disables
 * build networking by default; enabling it here is an explicit choice for this
 * public educational source.
 *
 * The longer timeout allows for the first Docker image pull and an empty Cargo
 * cache. Later runs normally reuse the local image and complete faster.
 */
const verifier = new ContractBuildVerifier({
  allowBuildNetwork: true,
  limits: { timeoutMs: 5 * 60 * 1000 },
});

console.log(chalk.bold("\n1. Resolving the immutable GitHub source..."));
console.log(`${source.owner}/${source.repository}@${source.revision}`);

console.log(chalk.bold("\n2. Rebuilding the contract in Docker..."));
const result = await verifier.verify({
  mode: "outOfBand",
  target: {
    wasm: targetWasm,
    label: "Soroban examples Hello World fixture",
  },
  source,
  recipe,
});

/**
 * Completed results are evidence, not just a boolean. We persist the structured
 * evidence and bounded stage logs so another developer can inspect precisely
 * which source, image, recipe, artifact, and comparison produced the result.
 */
const outputDirectory = new URL("./.verification/", import.meta.url);
await Deno.mkdir(outputDirectory, { recursive: true });
await writeVerificationEvidence(
  new URL("github-evidence.json", outputDirectory).pathname,
  result,
);
await writeVerificationLogs(
  new URL("github-logs.jsonl", outputDirectory).pathname,
  result.evidence.logs,
);

console.log(chalk.bold("\n3. Inspecting the byte comparison..."));
switch (result.status) {
  case "verified":
    console.log(
      chalk.green(
        `Verified: rebuilt and target Wasm are identical (${result.evidence.artifact?.sha256}).`,
      ),
    );
    break;
  case "mismatch":
    console.log(
      chalk.red("Mismatch: the rebuild completed, but its Wasm bytes differ."),
    );
    Deno.exitCode = 2;
    break;
  case "notApplicable":
    console.log(chalk.yellow(`Not applicable: ${result.reason}`));
    break;
}

console.log(
  chalk.dim(
    "Evidence and logs were written under examples/build-verification/.verification/.",
  ),
);
