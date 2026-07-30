/**
 * Example: Route contract authorization through one contract delegate.
 *
 * Topology:
 *
 * DelegatedAssetAccount
 * └── RecursiveDelegateAccount
 *     └── G... leaf signer
 *
 * The top-level contract owns the XLM. It delegates authorization to another
 * contract, which delegates again to an Ed25519 account. The file shows the
 * complete on-chain construction and the matching off-chain
 * `DelegatedSigner` tree without wrapping either one in an example-only API.
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
  chalk.bgBlue("Recursive delegated authorization on Stellar Testnet"),
);

/**
 * Select Testnet, connect to RPC, and confirm the network supports CAP-71.
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
 * `admin` owns the transaction envelopes, `recipient` receives the withdrawal,
 * and `leaf` produces the Ed25519 signature at the end of the delegated chain.
 */
const admin = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const leaf = LocalSigner.generateRandom();

console.log("Admin:", chalk.green(admin.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Delegate leaf:", chalk.green(leaf.publicKey()));

/**
 * Create and fund all three disposable accounts through Friendbot. The leaf
 * needs ledger state because enforcing simulation checks its account weights.
 */
for (const signer of [admin, recipient, leaf]) {
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
 * The admin pays for uploads, deployments, the deposit, and the withdrawal
 * envelope. Delegated signers will be added only to the protected invocation.
 */
const transactionConfig: TransactionConfig = {
  source: admin.publicKey(),
  fee: "10000000",
  timeout: 120,
  signers: [admin],
};

/**
 * Upload the top-level asset-account code.
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

/**
 * Upload the reusable recursive authorization-node code.
 *
 * Uploading once is sufficient even though more complex examples deploy
 * multiple instances of this same WASM.
 */
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
 * Deploy the intermediate contract first.
 *
 * Its constructor stores the leaf's G... address, so this contract will accept
 * the Ed25519 account as its only immediate delegate.
 */
const recursiveDelegate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: recursiveTemplate.getWasmHash(),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

await recursiveDelegate.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [leaf.publicKey()],
  },
});

const recursiveDelegateId = recursiveDelegate.getContractId();
console.log("Recursive delegate:", chalk.green(recursiveDelegateId));

/**
 * Deploy the top-level asset account second.
 *
 * Its constructor stores the recursive contract address, not the leaf address.
 * Each contract knows only its immediate delegate; together their constructor
 * values form the complete on-chain chain.
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
    nested_delegates: [recursiveDelegateId],
  },
});

const assetAccountId = assetAccount.getContractId();
console.log("Asset account:", chalk.green(assetAccountId));

/**
 * Build the same topology off-chain from the leaf upward.
 *
 * The leaf node wraps the only secret key in the delegated tree.
 */
const leafSigner = new DelegatedSigner({
  address: leaf.publicKey(),
  signer: leaf,
});

/**
 * The recursive contract node has no local key. Its nested delegate is the leaf
 * that its constructor allows.
 */
const recursiveSigner = new DelegatedSigner({
  address: recursiveDelegateId,
  nestedDelegates: [leafSigner],
});

/**
 * The top-level signer represents the asset account and contains the recursive
 * contract node. This is the only delegated signer added to the transaction
 * config because it owns the complete nested topology.
 */
const accountSigner = new DelegatedSigner({
  address: assetAccountId,
  nestedDelegates: [recursiveSigner],
});

/**
 * Deposit 2 XLM into the custom account through the native Stellar Asset
 * Contract, then read its balance before withdrawal.
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
 * Invoke the protected withdrawal with both authorization domains:
 *
 * - `admin` signs the transaction envelope;
 * - `accountSigner` authorizes the contract account.
 *
 * After Colibri assembles the nested credentials, enforcing simulation runs
 * `__check_auth` first on the asset account and then on the recursive contract.
 * The final branch succeeds when Stellar validates the leaf signature.
 */
console.log("Withdrawing 1 XLM through the recursive delegate...");
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
    "Authorization traversed the contract delegate before the Ed25519 leaf signed.",
  ),
);
