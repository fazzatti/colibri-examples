/**
 * Example: Authorize a contract account with one direct Ed25519 delegate.
 *
 * This is the smallest CAP-71 delegated authorization topology:
 *
 * DelegatedAssetAccount -> G... leaf signer
 *
 * The script keeps the entire flow in this file so you can see both sides of
 * the topology:
 *
 * 1. the contract is constructed with the address it trusts on-chain;
 * 2. the application creates the matching `DelegatedSigner` tree off-chain;
 * 3. Colibri records the required authorization, signs the leaf, assembles the
 *    delegated credentials, enforces them in a second simulation, and submits
 *    the transaction.
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

console.log(
  chalk.bgBlue("Direct delegated authorization on Stellar Testnet"),
);

/**
 * Delegated authorization requires Protocol 27.
 *
 * `NetworkConfig.TestNet()` supplies the network passphrase, RPC URL, and
 * Friendbot URL. We create the RPC client explicitly because the example also
 * uses it to verify the live protocol version.
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
 * The three identities have different responsibilities:
 *
 * - `admin` pays fees, uploads and deploys the contract, funds the contract
 *   account, and signs the transaction envelope;
 * - `recipient` receives the withdrawn XLM;
 * - `leaf` signs the delegated Soroban authorization payload.
 *
 * The leaf is not the transaction source. Its signature authorizes the contract
 * account's invocation inside the transaction.
 */
const admin = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const leaf = LocalSigner.generateRandom();

console.log("Admin:", chalk.green(admin.publicKey()));
console.log("Recipient:", chalk.green(recipient.publicKey()));
console.log("Delegate leaf:", chalk.green(leaf.publicKey()));

/**
 * Friendbot creates and funds the disposable Testnet accounts.
 *
 * The leaf must be a live account because enforcing simulation reads its signer
 * weights from the ledger before accepting its Ed25519 signature.
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
 * Every contract upload, deployment, transfer, and invocation travels in a
 * transaction envelope. The admin is the source and envelope signer for those
 * transactions.
 */
const transactionConfig: TransactionConfig = {
  source: admin.publicKey(),
  fee: "10000000",
  timeout: 120,
  signers: [admin],
};

/**
 * The repository includes the compiled WASM and generated TypeScript spec.
 * Running the example therefore does not require Rust or Stellar CLI.
 *
 * First we upload the WASM. Uploading stores reusable contract code on-chain
 * and gives the `Contract` instance its WASM hash.
 */
const assetAccountWasm = await Deno.readFile(
  new URL(
    "./contracts/artifacts/delegated_asset_account_contract.wasm",
    import.meta.url,
  ),
);
const assetAccountTemplate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasm: assetAccountWasm,
    spec: DELEGATED_ASSET_ACCOUNT_SPEC,
  },
});

console.log("Uploading the delegated asset account WASM...");
await assetAccountTemplate.uploadWasm(transactionConfig);

/**
 * We now deploy one instance of that code.
 *
 * The constructor stores `leaf.publicKey()` as the contract's only immediate
 * delegate. This is the on-chain authorization policy: when the contract later
 * checks authorization, it will accept exactly this delegated address.
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
    nested_delegates: [leaf.publicKey()],
  },
});

const assetAccountId = assetAccount.getContractId();
console.log("Asset account:", chalk.green(assetAccountId));

/**
 * Next we build the matching topology with Colibri's public signer API.
 *
 * The leaf node identifies the G... address it represents and wraps the
 * `LocalSigner` that owns its secret key.
 */
const leafSigner = new DelegatedSigner({
  address: leaf.publicKey(),
  signer: leaf,
});

/**
 * The top-level node represents the contract account. Contract nodes have no
 * private key of their own; they contain their immediate delegated signers.
 *
 * Only this completed top-level `accountSigner` will be added to
 * `config.signers`. It carries the complete nested authorization topology.
 */
const accountSigner = new DelegatedSigner({
  address: assetAccountId,
  nestedDelegates: [leafSigner],
});

/**
 * Native XLM is available to Soroban through its Stellar Asset Contract (SAC).
 * We deposit 2 XLM into the custom account before asking it to withdraw 1 XLM.
 *
 * Amounts are expressed in stroops: 10,000,000 stroops equals 1 XLM.
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
 * `withdraw` calls `require_auth()` for the contract's own address.
 *
 * The signers array contains two different authorization roles:
 *
 * - `admin` signs the outer transaction envelope;
 * - `accountSigner` authorizes the contract account and contains the leaf.
 *
 * Colibri's contract pipeline first performs recording simulation to discover
 * the top-level authorization entry. It signs the leaf and assembles the
 * delegated credential tree, then performs enforcing simulation so Stellar can
 * execute `__check_auth` and verify that the supplied delegate matches the
 * constructor policy. Only then is the final transaction submitted.
 */
console.log("Withdrawing 1 XLM through the direct delegate...");
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
    "The contract accepted its configured G... delegate and Colibri submitted the enforced authorization tree.",
  ),
);
