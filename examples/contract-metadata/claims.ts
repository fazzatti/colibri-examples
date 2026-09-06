import {
  claimsSep,
  extractContractMetadata,
  extractSepClaims,
} from "@colibri/core";

// This is a byte-reading lesson: no RPC, deployment, or build is needed.
// It reads the same purpose-built token used by the SEP-41 allowance lesson.
const wasm = await Deno.readFile(
  new URL("../sep41-token/contract/token.wasm", import.meta.url),
);
const metadata = extractContractMetadata(wasm);
console.log("All metadata:", metadata);
const claims = extractSepClaims(metadata);
console.log("SEP claims:", claims);
console.log("Claims SEP-41:", claimsSep(claims, 41));
// A claim only means the author wrote this metadata. It does not verify the
// interface, authorization policy, behavior, or source reproducibility.
