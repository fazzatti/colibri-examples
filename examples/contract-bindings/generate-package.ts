/**
 * Contract Bindings Example: Generate a Package
 *
 * A Soroban contract carries a specification inside its compiled Wasm. We use
 * that specification to create a TypeScript package with a client, types,
 * error definitions and event helpers. Start here before running the consumers.
 */
import { fileURLToPath } from "node:url";
import {
  generateBindings,
  loadBindingSource,
} from "@colibri/contract-bindings";
import { writeBindings } from "@colibri/contract-bindings/cli";

/**
 * First, read the compiled counter from this lesson's contract directory.
 * Its Rust source declares four methods, a summary struct, a status enum,
 * contract errors and an event. These declarations are embedded in the Wasm,
 * so generation does not require uploading or deploying the contract.
 */
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const source = await loadBindingSource({ kind: "wasm", wasm });

/**
 * Next, turn the specification into a package plan. We choose a JSR package
 * because the following examples run in Deno. The plan contains the generated
 * client and the package's manifest, public entrypoint and README.
 *
 * Counter is our chosen JavaScript class name; the specification does not
 * supply a dependable contract name. @example/counter is the local package
 * name that the consumer scripts will import. Nothing is published here.
 */
const plan = generateBindings(source.spec, {
  className: "Counter",
  output: "package",
  target: "jsr",
  packageName: "@example/counter",
});

for (const warning of plan.warnings) console.warn(warning);

/**
 * This repository already has a Deno workspace. Give the new package its own
 * empty workspace so it can also be checked independently on Deno 2.7.
 * Package scaffolds are editable, so we prepare this setting before writing.
 */
const packageConfig = JSON.parse(plan.scaffold["deno.json"]);
packageConfig.workspace = [];
const scaffold = {
  ...plan.scaffold,
  "deno.json": `${JSON.stringify(packageConfig, null, 2)}\n`,
};

/**
 * Finally, write the plan into package/ beside this script. Git ignores this
 * directory: the lesson starts from the contract, and you create the package.
 *
 * force allows generated client files to be replaced when you run this again.
 * Existing scaffolds such as mod.ts, deno.json and README.md are preserved so
 * handwritten package customizations are not overwritten.
 */
const directory = fileURLToPath(new URL("./package", import.meta.url));
const written = await writeBindings({ ...plan, scaffold }, {
  directory,
  force: true,
});

console.log("Package directory:", directory);
console.log("Generated files:", written.written);
console.log("Preserved scaffolds:", written.preserved);
console.log("Next: inspect package/mod.ts, then run deno task values.");
