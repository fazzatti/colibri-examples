import {
  generateBindings,
  loadBindingSource,
} from "@colibri/contract-bindings";

// Reuse the reviewed counter contract from the independent bindings lesson.
// Reading its embedded ABI requires no RPC, wallet or Rust toolchain.
const wasm = await Deno.readFile(
  new URL("../../contract-bindings/contract/counter.wasm", import.meta.url),
);
const source = await loadBindingSource({ kind: "wasm", wasm });
const plan = generateBindings(source.spec, {
  className: "Counter",
  target: "npm",
  output: "files",
  includeColibri: false,
});

// Generated files are disposable and ignored by Git. The lesson imports Core
// directly instead of emitting another colibri.ts convenience re-export.
const directory = new URL("../src/generated/counter/", import.meta.url);
await Deno.mkdir(directory, { recursive: true });
for (const [name, contents] of Object.entries(plan.files)) {
  await Deno.writeTextFile(new URL(name, directory), contents);
}
console.log("Generated counter client in src/generated/counter/ (offline).");
