/**
 * Example: Authorize through two nested contract delegates.
 *
 * Topology:
 *
 * DelegatedAssetAccount
 * └── Outer RecursiveDelegateAccount
 *     └── Inner RecursiveDelegateAccount
 *         └── G... leaf signer
 *
 * This extends the recursive example by one contract level. Every deployment
 * and every `DelegatedSigner` constructor remains visible so you can see that
 * delegated authorization is recursive rather than limited to one intermediary.
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
  chalk.bgBlue("Deeply nested delegated authorization on Stellar Testnet"),
);

/**
 * Connect to Testnet and fail early if the live network does not support the
 * Protocol 27 delegated-authorization XDR and host behavior.
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
 * The admin signs transaction envelopes, the recipient receives XLM, and the
 * leaf signs the authorization payload after both contract delegates approve
 * their respective child.
 */
const admin = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const leaf = LocalSigner.generateRandom();

console.log("Admin:", chalk.green(admin.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Delegate leaf:", chalk.green(leaf.publicKey()));

/**
 * Friendbot creates the disposable Testnet accounts. The leaf's account state
 * is required when enforcing simulation evaluates its signer weight.
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
 * The same admin configuration pays for all setup transactions and signs their
 * envelopes. The delegated signer is introduced only for the withdrawal.
 */
const transactionConfig: TransactionConfig = {
  source: admin.publicKey(),
  fee: "10000000",
  timeout: 120,
  signers: [admin],
};

/**
 * Upload the two reusable WASM templates checked into this example project.
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
 * Construct the on-chain topology from its deepest node upward.
 *
 * The inner recursive contract accepts the G... leaf as its immediate delegate.
 */
const innerDelegate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: recursiveTemplate.getWasmHash(),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

await innerDelegate.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [leaf.publicKey()],
  },
});

const innerDelegateId = innerDelegate.getContractId();
console.log("Inner recursive delegate:", chalk.green(innerDelegateId));

/**
 * The outer recursive contract accepts the inner contract as its immediate
 * delegate. It does not need to know which leaf exists deeper in the tree.
 */
const outerDelegate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasmHash: recursiveTemplate.getWasmHash(),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});

await outerDelegate.deploy({
  config: transactionConfig,
  constructorArgs: {
    nested_delegates: [innerDelegateId],
  },
});

const outerDelegateId = outerDelegate.getContractId();
console.log("Outer recursive delegate:", chalk.green(outerDelegateId));

/**
 * Finally, the asset-owning custom account accepts the outer contract as its
 * immediate delegate.
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
    nested_delegates: [outerDelegateId],
  },
});

const assetAccountId = assetAccount.getContractId();
console.log("Asset account:", chalk.green(assetAccountId));

/**
 * Mirror the on-chain topology off-chain, again from the deepest node upward.
 *
 * Only the leaf wraps a signer with a private key.
 */
const leafSigner = new DelegatedSigner({
  address: leaf.publicKey(),
  signer: leaf,
});

const innerSigner = new DelegatedSigner({
  address: innerDelegateId,
  nestedDelegates: [leafSigner],
});

const outerSigner = new DelegatedSigner({
  address: outerDelegateId,
  nestedDelegates: [innerSigner],
});

/**
 * This top-level object contains the whole recursive signer tree. Supplying it
 * to Colibri is sufficient; the pipeline walks the nested signers internally.
 */
const accountSigner = new DelegatedSigner({
  address: assetAccountId,
  nestedDelegates: [outerSigner],
});

/**
 * Fund the custom account with 2 XLM through the native SAC.
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
 * Invoke the withdrawal with the admin envelope signer and the one top-level
 * delegated signer.
 *
 * Enforcing simulation traverses three custom-account checks: the asset
 * account, the outer recursive account, and the inner recursive account. The
 * branch terminates when Stellar verifies the leaf's Ed25519 signature.
 */
console.log("Withdrawing 1 XLM through the nested delegates...");
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
    "The authorization branch passed through two nested contracts before reaching its Ed25519 leaf.",
  ),
);
