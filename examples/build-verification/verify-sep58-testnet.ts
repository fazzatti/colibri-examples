import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import {
  ContractBuildVerifier,
  writeVerificationEvidence,
} from "@colibri/build-verification";
// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using deployer = LocalSigner.generateRandom();
for (const signer of [deployer]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

// These PUBLIC, purpose-built Colibri fixtures are pinned to an immutable
// release commit. Unlike the older Hello World lesson, this Wasm embeds SEP-58
// build metadata. No caller-supplied recipe or outOfBand mode is used.
const revision = "0b8225d3bcd8925f762b915fa5dc7a9d78572365";
const base =
  `https://raw.githubusercontent.com/fazzatti/colibri/${revision}/_internal/build-verification/fixtures`;
const wasmResponse = await fetch(`${base}/upgradeable-v1.wasm`);
if (!wasmResponse.ok) {
  throw new Error(`Wasm download failed: ${wasmResponse.status}`);
}
const wasm = new Uint8Array(await wasmResponse.arrayBuffer());
const archiveResponse = await fetch(`${base}/upgradeable-source.tar.gz`);
if (!archiveResponse.ok) {
  throw new Error(`Source download failed: ${archiveResponse.status}`);
}
const sourceBytes = new Uint8Array(await archiveResponse.arrayBuffer());

// Deploy an ephemeral Testnet instance, then ask the verifier to resolve its
// CURRENT executable through RPC. A contract ID is not an immutable code hash:
// an upgradeable contract could point to another Wasm in a later observation.
const contract = new Contract({ networkConfig, contractConfig: { wasm } });
await contract.uploadWasm(deployerConfig);
await contract.deploy({ config: deployerConfig });
console.log("Testnet fixture:", contract.getContractId());

// The embedded recipe selects a digest-pinned SDF build image. Docker executes
// source code; only use trusted inputs locally. Build networking is an explicit
// opt-in here for toolchain bootstrap, even though source dependencies are vendored.
const verifier = new ContractBuildVerifier({
  network: { networkConfig },
  allowBuildNetwork: true,
  limits: { timeoutMs: 5 * 60 * 1000 },
});
const result = await verifier.verify({
  target: { contractId: contract.getContractId() },
  // "archive" accepts bytes already obtained by the caller. Colibri validates
  // them against the source digest EMBEDDED in this Wasm's SEP-58 metadata.
  source: {
    type: "archive",
    name: "upgradeable-source.tar.gz",
    bytes: sourceBytes,
  },
});
const directory = new URL("./.verification/", import.meta.url);
await Deno.mkdir(directory, { recursive: true });
await writeVerificationEvidence(
  new URL("sep58-evidence.json", directory).pathname,
  result,
);
console.log("Strict SEP-58 result:", result.status);
console.log("Evidence:", new URL("sep58-evidence.json", directory).pathname);
if (result.status !== "verified") {
  throw new Error("Expected the pinned SEP-58 fixture to reproduce exactly");
}
// The fixture has an intentionally unprotected upgrade method. It is not an
// example of production access control. Reproducibility is not a security audit.
