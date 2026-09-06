import {
  analyzeContractInterface,
  ContractStandards,
  extractContractSpec,
} from "@colibri/core";

// Interface analysis is independent of metadata claims. A contract could omit
// a claim and still match an ABI, or claim a SEP and expose an incompatible ABI.
const wasm = await Deno.readFile(
  new URL("../sep41-token/contract/token.wasm", import.meta.url),
);

const spec = extractContractSpec(wasm);

// 'latest' means the newest definition bundled with this Colibri release,
// not a live lookup. Extra methods are allowed. Structural matching does not
// execute the contract or establish that its economics/security are correct.
const report = analyzeContractInterface(spec, ContractStandards.SEP41.latest);

console.log("Matches the bundled SEP-41 interface:", report.matches);
console.log("Missing functions:", report.missingFunctions);
console.log("Incompatible functions:", report.incompatibleFunctions);
console.log("Additional functions:", report.additionalFunctions);
