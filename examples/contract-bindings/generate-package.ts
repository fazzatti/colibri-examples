import { fileURLToPath } from "node:url";
import {
  generateBindings,
  loadBindingSource,
} from "@colibri/contract-bindings";
import { writeBindings } from "@colibri/contract-bindings/cli";

// Local Wasm contains the ABI, including documented types, errors and events.
// Loading it needs no contract address, funded account or network request.
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);
const loaded = await loadBindingSource({ kind: "wasm", wasm });

// Rendering creates an in-memory plan. A package adds a manifest and entrypoint
// around the generated files; this example deliberately opts into provenance.
const plan = generateBindings(loaded.spec, {
  className: "Counter",
  output: "package",
  target: "jsr",
  packageName: "@example/counter",
  provenance: loaded.provenance,
});

for (const warning of plan.warnings) console.warn(warning);

// This repository is already a Deno workspace. Give the generated package an
// independent workspace so Deno 2.7 can check it without joining this one.
const packageConfig = JSON.parse(plan.scaffold["deno.json"]);
packageConfig.workspace = [];
const scaffold = {
  ...plan.scaffold,
  "deno.json": `${JSON.stringify(packageConfig, null, 2)}\n`,
};

// The Deno writer is a separate operation. Re-running replaces generated files
// but preserves existing package scaffolds and handwritten customizations.
const directory = fileURLToPath(
  new URL("../../.output/contract-bindings/jsr-counter", import.meta.url),
);
const written = await writeBindings({ ...plan, scaffold }, {
  directory,
  force: true,
});

console.log("Package directory:", directory);
console.log("Generated:", written.written);
console.log("Preserved:", written.preserved);
