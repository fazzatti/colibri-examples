/**
 * Example: Authorize a contract account through two parallel branches.
 *
 * Topology:
 *
 * DelegatedAssetAccount
 * ├── RecursiveDelegateAccount A
 * │   └── G... leaf signer A
 * └── RecursiveDelegateAccount B
 *     └── G... leaf signer B
 *
 * This example shows that delegated authorization can fan out. The top-level
 * custom account requires both immediate contract delegates, and each branch
 * terminates in a different Ed25519 signature.
 */
import {
  Contract,
  DelegatedSigner,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
  type TransactionConfig,
} from "@colibri/core";
import { Server } from "stellar-sdk/rpc";
import chalk from "chalk";
import { DELEGATED_ASSET_ACCOUNT_SPEC } from "./contracts/specs/delegated-asset-account.ts";
import { RECURSIVE_DELEGATE_ACCOUNT_SPEC } from "./contracts/specs/recursive-delegate-account.ts";

console.log(
  chalk.bgBlue("Branching delegated authorization on Stellar Testnet"),
);

/**
 * Connect to Testnet and confirm Protocol 27 support before deploying anything.
 */
const networkConfig = NetworkConfig.TestNet();
const rpc = new Server(networkConfig.rpcUrl, {
  allowHttp: networkConfig.allowHttp,
});

const latestLedger = await rpc.getLatestLedger();
if (Number(latestLedger.protocolVersion) < 27) {
  throw new Error(
    `Delegated authorization requires Protocol 27; Testnet reports ${latestLedger.protocolVersion}`,
  );
}
console.log("Protocol:", chalk.green(latestLedger.protocolVersion));

/**
 * The admin signs transaction envelopes, the recipient receives XLM, and each
 * leaf owns the secret key for one independent delegated branch.
 */
const admin = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const leafA = LocalSigner.generateRandom();
const leafB = LocalSigner.generateRandom();

console.log("Admin:", chalk.green(admin.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Delegate leaf A:", chalk.green(leafA.publicKey()));
console.log("Delegate leaf B:", chalk.green(leafB.publicKey()));

/**
 * Friendbot creates all four Testnet accounts. Both leaves need account state
 * because enforcing simulation resolves each leaf's signer weight.
 */
for (const signer of [admin, recipient, leafA, leafB]) {
  console.log(`Funding ${signer.publicKey()} with Friendbot...`);
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}

/**
 * The admin pays fees and signs every setup envelope. The delegated signer tree
 * will be supplied only for the protected withdrawal.
 */
const transactionConfig: TransactionConfig = {
  source: admin.publicKey(),
  fee: "10000000",
  timeout: 120,
  signers: [admin],
};

/**
 * Upload both checked-in contract templates.
 */
const assetAccountTemplate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasm: await Deno.readFile(
      new URL(
        "./contracts/artifacts/delegated_asset_account_contract.wasm",
        import.meta.url,
      ),
    ),
    spec: DELEGATED_ASSET_ACCOUNT_SPEC,
  },
});

console.log("Uploading the delegated asset account WASM...");
await assetAccountTemplate.uploadWasm(transactionConfig);

const recursiveTemplate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasm: await Deno.readFile(
      new URL(
        "./contracts/artifacts/recursive_delegate_account_contract.wasm",
        import.meta.url,
      ),
    ),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

console.log("Uploading the recursive delegate account WASM...");
await recursiveTemplate.uploadWasm(transactionConfig);

/**
 * Deploy branch A and configure it to accept only leaf A.
 */
const branchA = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: recursiveTemplate.getWasmHash(),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

await branchA.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [leafA.publicKey()],
  },
});

const branchAId = branchA.getContractId();
console.log("Recursive branch A:", chalk.green(branchAId));

/**
 * Deploy branch B and configure it to accept only leaf B.
 */
const branchB = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: recursiveTemplate.getWasmHash(),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

await branchB.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [leafB.publicKey()],
  },
});

const branchBId = branchB.getContractId();
console.log("Recursive branch B:", chalk.green(branchBId));

/**
 * Deploy the asset-owning account with both recursive contracts as immediate
 * delegates. Its custom authorization requires the complete two-branch set.
 */
const assetAccount = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: assetAccountTemplate.getWasmHash(),
    spec: DELEGATED_ASSET_ACCOUNT_SPEC,
  },
});

await assetAccount.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [branchAId, branchBId],
  },
});

const assetAccountId = assetAccount.getContractId();
console.log("Asset account:", chalk.green(assetAccountId));

/**
 * Mirror branch A off-chain with Colibri's public `DelegatedSigner` API.
 */
const leafSignerA = new DelegatedSigner({
  address: leafA.publicKey(),
  signer: leafA,
});
const branchSignerA = new DelegatedSigner({
  address: branchAId,
  nestedDelegates: [leafSignerA],
});

/**
 * Mirror branch B independently.
 */
const leafSignerB = new DelegatedSigner({
  address: leafB.publicKey(),
  signer: leafB,
});
const branchSignerB = new DelegatedSigner({
  address: branchBId,
  nestedDelegates: [leafSignerB],
});

/**
 * Join the two branches under the top-level contract signer.
 *
 * Their order matches the constructor arguments above. This single object now
 * contains every node and both signing leaves.
 */
const accountSigner = new DelegatedSigner({
  address: assetAccountId,
  nestedDelegates: [branchSignerA, branchSignerB],
});

/**
 * Deposit 2 XLM into the contract account through the native SAC.
 */
const XLM = StellarAssetContract.NativeXLM(networkConfig);
const deposit = 20_000_000n;
const withdrawal = 10_000_000n;

console.log("Depositing 2 XLM into the contract account...");
await XLM.transfer({
  from: admin.publicKey(),
  to: assetAccountId,
  amount: deposit,
  config: transactionConfig,
});

const balanceBefore = await XLM.balance({ id: assetAccountId });
console.log(
  "Balance before withdrawal:",
  chalk.green(balanceBefore),
  "stroops",
);

/**
 * Invoke the withdrawal with `admin` for the envelope and `accountSigner` for
 * the custom account.
 *
 * Colibri recursively signs both leaves and assembles both branches. Enforcing
 * simulation succeeds only if the asset account sees both configured contract
 * delegates and each recursive contract validates its own leaf.
 */
console.log("Withdrawing 1 XLM through both delegated branches...");
const result = await assetAccount.invoke({
  method: "withdraw",
  methodArgs: {
    token: XLM.contractId,
    to: recipient.publicKey(),
    amount: withdrawal,
  },
  config: {
    ...transactionConfig,
    signers: [admin, accountSigner],
  },
});

const balanceAfter = await XLM.balance({ id: assetAccountId });

console.log("Withdrawal transaction:", chalk.green(result.hash));
console.log("Balance after withdrawal:", chalk.green(balanceAfter), "stroops");
console.log(
  chalk.yellow(
    "Both delegated branches and both Ed25519 leaf signatures were enforced before submission.",
  ),
);
