/**
 * Example: Contract Metadata Claims
 *
 * Read author-provided metadata from a local Wasm and extract its declared
 * SEPs. This identifies what the author claims; it does not test the
 * contract interface or execute code.
 *
 * Run: deno task claims
 */
import {
  claimsSep,
  extractContractMetadata,
  extractSepClaims,
} from "@colibri/core";

/**
 * This is a byte-reading lesson: no RPC, deployment, or build is needed. It
 * reads the same purpose-built token used by the SEP-41 allowance lesson.
 */
const wasm = await Deno.readFile(
  new URL("../sep41-token/contract/token.wasm", import.meta.url),
);

/**
 * Extract the contract metadata entries from the Wasm custom section. This
 * reads declarations embedded in the file; it neither queries a network nor
 * evaluates whether those declarations are accurate.
 */
const metadata = extractContractMetadata(wasm);

console.log("All metadata:", metadata);

/**
 * A claim only means the author wrote this metadata. It does not verify the
 * interface, authorization policy, behavior, or source reproducibility.
 */
const claims = extractSepClaims(metadata);

console.log("SEP claims:", claims);
console.log("Claims SEP-41:", claimsSep(claims, 41));
