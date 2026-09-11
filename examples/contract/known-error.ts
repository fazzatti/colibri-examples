/**
 * Example: Named Contract Errors
 *
 * Load errors from a counter Wasm and associate them with this deployed
 * contract ID. Invoke a deliberately rejecting method and inspect the
 * matched error from simulation.
 *
 * Run: deno task error
 */
import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { KNOWN_CONTRACT_ERROR_SIMULATION_FAILED } from "@colibri/core";

/**
 * Create a fresh Testnet deployer so this failure lesson has its own
 * contract instance. Friendbot pays for setup with test XLM; the later
 * rejected invocation is detected before submission.
 */
const networkConfig = NetworkConfig.TestNet();
using deployer = LocalSigner.generateRandom();

await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  deployer.publicKey(),
  {
    rpcUrl: networkConfig.rpcUrl,
    allowHttp: networkConfig.allowHttp,
  },
);

/**
 * The transaction configuration names its source account and the signers
 * allowed to satisfy its requirements. base is an inclusion bid per
 * operation in stroops; Soroban simulation adds resource fees when needed.
 * timeout sets transaction validity in seconds, not an RPC request deadline.
 */
const deployerConfig: TransactionConfig = {
  source: deployer.publicKey(),
  signers: [deployer],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * Loading the ABI from the checked-in Wasm keeps method argument names tied
 * to the actual contract. Upload stores code; deploy creates a separate
 * instance.
 */
const wasm = await Deno.readFile(
  new URL("./contract/counter.wasm", import.meta.url),
);

const counter = new Contract({
  networkConfig,
  contractConfig: { wasm },
});

// The specification describes argument names, return values, and error enums.
await counter.loadSpecFromWasm();

// Upload the code first. Other instances could reuse the same on-chain Wasm.
await counter.uploadWasm(deployerConfig);

// Deployment creates this counter's own address and storage.
await counter.deploy({ config: deployerConfig });

console.log("Deployed counter:", counter.getContractId());

/**
 * The Wasm specification contains the contract's named error enum. Scope the
 * matcher to this contract ID so unrelated contracts with error 1 cannot
 * accidentally be labelled as our counter's error.
 */
await counter.loadContractErrorsFromWasm({ strategy: "contract-id" });

/**
 * This method deliberately fails in simulation. Catch only the mapped error;
 * unrelated RPC or setup failures must still stop the lesson.
 */
try {
  await counter.invoke({ method: "reject", config: deployerConfig });

  throw new Error("The deliberately rejecting method unexpectedly succeeded");
} catch (error) {
  if (!(error instanceof KNOWN_CONTRACT_ERROR_SIMULATION_FAILED)) throw error;

  // The match carries the contract-specific name decoded from the Wasm enum.
  const matchedError = error.meta.data.match;

  console.log("Matched contract error:", matchedError);
}
