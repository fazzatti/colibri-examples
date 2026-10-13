/**
 * Example: Inspect a deployed contract for SEP-41 compatibility
 *
 * Fetch the selected contract's Wasm through RPC, inspect its SEP declarations,
 * and compare its embedded interface with Colibri's bundled SEP-41 versions.
 * This reads ledger data; it does not execute or submit contract calls.
 *
 * Run: deno task inspect <mainnet|testnet> <CONTRACT_ID>
 */
import {
  Contract,
  ContractStandards,
  NetworkConfig,
  StrKey,
} from "@colibri/core";

const usage = "Usage: deno task inspect <mainnet|testnet> <CONTRACT_ID>";

if (Deno.args.length === 1 && Deno.args[0] === "--help") {
  console.log(usage);
  Deno.exit(0);
}

const [network, contractId] = Deno.args;

// A contract ID is meaningful on one network. Require both inputs explicitly
// and validate the StrKey checksum before making any RPC requests.
if (
  Deno.args.length !== 2 ||
  (network !== "mainnet" && network !== "testnet")
) {
  console.error(usage);
  Deno.exit(2);
}

if (!StrKey.isValidContractId(contractId)) {
  console.error("Expected a valid C-prefixed Stellar contract ID.");
  Deno.exit(2);
}

// These presets select the public RPC endpoint and network passphrase. No
// signer, funded account, or transaction configuration is needed for inspection.
const networkConfig = network === "mainnet"
  ? NetworkConfig.MainNet()
  : NetworkConfig.TestNet();
const contract = new Contract({
  networkConfig,
  contractConfig: { contractId },
});

console.log("Network:", network);
console.log("Contract:", contractId);
console.log("RPC:", networkConfig.rpcUrl);

// Resolve the deployed instance to its code, download the Wasm, and decode its
// embedded specification. An unavailable or unparseable artifact is an
// incomplete inspection, not evidence that the contract violates SEP-41.
try {
  await contract.loadSpecFromNetwork();
} catch (error) {
  console.error("Could not load the deployed Wasm/specification; no verdict.");
  console.error(error);
  Deno.exit(1);
}

const snapshot = contract.getLoadedSnapshot();

console.log("Wasm SHA-256:", contract.getWasmHash());
console.log("Wasm bytes:", contract.getWasm().byteLength);
console.log("Code observed at ledger:", snapshot?.observedAtLedger);

// SEP-47 metadata is an author's declaration. Its presence does not prove
// compatibility, and its absence does not make an otherwise matching ABI fail.
// Keep malformed declarations visible rather than silently accepting them.
const claims = contract.getSepClaims();

console.log("\nDeclares SEP-41:", contract.claimsSep(41));
console.log("Declared SEPs:", claims.seps);
console.log(
  "Malformed SEP declarations:",
  JSON.stringify(claims.invalidClaims),
);

// SEP-41 evolved: older versions use Address for transfer's destination, while
// newer bundled versions use MuxedAddress. Show every bundled version so a
// mismatch with the newest definition does not hide an older interface match.
const versions = Object.values(ContractStandards.SEP41.versions);
const compatibility = versions.map((standard) => ({
  version: standard.version,
  strictMatch: contract.matchesInterface(standard),
}));

console.log("\nBundled SEP-41 interface comparisons:");
console.table(compatibility);

// "latest" selects the newest definition shipped with this installed Colibri
// version, not the current document on the internet. Report the exact version
// and full expected/actual diagnostics; additional methods are permitted.
const latest = ContractStandards.SEP41.latest;
const report = contract.analyzeInterface(latest);

console.log(`\nDetails for bundled SEP-41 ${latest.version}:`);
console.log(
  "Colibri compares parameter names as well as argument/return types.",
);
console.log(JSON.stringify(report, null, 2));
console.log(
  "\nRuntime behavior, authorization, accounting, and event emission: not verified.",
);
