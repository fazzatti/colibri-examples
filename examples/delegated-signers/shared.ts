/**
 * Shared Testnet setup for the delegated authorization examples.
 *
 * The four entrypoints keep their distinct authorization topologies visible.
 * This module contains only the repeated infrastructure around those
 * topologies: disposable identities, WASM upload, contract deployment, XLM
 * funding, and the protected withdrawal.
 */
import {
  Contract,
  type ContractId,
  DelegatedSigner,
  LocalSigner,
  StellarAssetContract,
  type TransactionConfig,
} from "@colibri/core";
import chalk from "chalk";
import { DELEGATED_ASSET_ACCOUNT_SPEC } from "./contracts/specs/delegated-asset-account.ts";
import { RECURSIVE_DELEGATE_ACCOUNT_SPEC } from "./contracts/specs/recursive-delegate-account.ts";
import { fund, networkConfig, rpc } from "./stellar.ts";

// Stellar represents one XLM as 10,000,000 stroops. BigInt keeps contract
// amounts exact and avoids floating-point rounding.
const DEPOSIT = 20_000_000n;
const WITHDRAWAL = 10_000_000n;

type PrepareDelegatedExampleOptions = {
  title: string;
  leafCount: number;
  includeRecursiveContract: boolean;
};

/**
 * Creates the disposable Testnet identities and reusable contract templates
 * needed by one delegated authorization example.
 *
 * `leafCount` determines how many independent Ed25519 branch endings exist.
 * `includeRecursiveContract` avoids uploading a contract template that the
 * direct-delegate example never uses.
 */
export async function prepareDelegatedExample(
  options: PrepareDelegatedExampleOptions,
) {
  console.log(chalk.bgBlue(`${options.title} on Stellar Testnet`));

  // Delegated Soroban authorization became available in Protocol 27. Checking
  // the live network first turns a confusing simulation failure into a clear
  // explanation if an example is pointed at an older network.
  console.log("\n1. Checking Testnet protocol support...");
  const latestLedger = await rpc.getLatestLedger();
  if (Number(latestLedger.protocolVersion) < 27) {
    throw new Error(
      `Delegated authorization requires Protocol 27; Testnet reports ${latestLedger.protocolVersion}`,
    );
  }
  console.log(
    "   Protocol:",
    chalk.green(latestLedger.protocolVersion.toString()),
  );

  // These identities have deliberately separate jobs:
  // - admin pays fees, deploys contracts, funds the contract account, and signs
  //   transaction envelopes;
  // - recipient receives the withdrawn XLM;
  // - leaves terminate delegated branches with Ed25519 signatures.
  console.log("\n2. Creating disposable Testnet identities...");
  const admin = LocalSigner.generateRandom();
  const recipient = LocalSigner.generateRandom();
  const leaves = Array.from(
    { length: options.leafCount },
    () => LocalSigner.generateRandom(),
  );

  console.log("   Admin:    ", chalk.green(admin.publicKey()));
  console.log("   Recipient:", chalk.green(recipient.publicKey()));
  leaves.forEach((leaf, index) =>
    console.log(`   Leaf ${index + 1}:     `, chalk.green(leaf.publicKey()))
  );

  // Friendbot creates the accounts and gives them enough Testnet XLM for this
  // learning flow. The leaf accounts must exist because enforcing simulation
  // resolves their signer weights from the ledger.
  console.log("\n3. Funding the disposable identities with Friendbot...");
  await fund(admin, recipient, ...leaves);

  // Contract invocations still travel inside a transaction envelope. The admin
  // is the envelope source and signer; delegated signers authorize only the
  // contract account's protected invocation.
  const transactionConfig: TransactionConfig = {
    source: admin.publicKey(),
    fee: "10000000",
    timeout: 120,
    signers: [admin],
  };

  // The repository checks in reproducible WASM artifacts so running an example
  // needs Deno and Testnet access, but not a local Rust or Stellar CLI toolchain.
  const loadWasm = async (name: string): Promise<Uint8Array> =>
    await Deno.readFile(
      new URL(`./contracts/artifacts/${name}`, import.meta.url),
    );

  console.log("\n4. Uploading the reusable contract template(s)...");
  console.log("   Uploading the delegated asset account WASM...");
  const assetTemplate = new Contract({
    networkConfig,
    rpc,
    contractConfig: {
      wasm: await loadWasm("delegated_asset_account_contract.wasm"),
      spec: DELEGATED_ASSET_ACCOUNT_SPEC,
    },
  });
  await assetTemplate.uploadWasm(transactionConfig);

  let recursiveTemplate: Contract | undefined;
  if (options.includeRecursiveContract) {
    console.log("   Uploading the recursive delegate account WASM...");
    recursiveTemplate = new Contract({
      networkConfig,
      rpc,
      contractConfig: {
        wasm: await loadWasm("recursive_delegate_account_contract.wasm"),
        spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
      },
    });
    await recursiveTemplate.uploadWasm(transactionConfig);
  }

  /**
   * Deploys a new asset-owning custom account.
   *
   * The constructor receives only its immediate on-chain delegate addresses.
   * Deeper relationships belong to the child contracts, not this node.
   */
  const deployAssetAccount = async (
    nestedDelegates: string[],
  ): Promise<Contract> => {
    const contract = new Contract({
      networkConfig,
      rpc,
      contractConfig: {
        wasmHash: assetTemplate.getWasmHash(),
        spec: DELEGATED_ASSET_ACCOUNT_SPEC,
      },
    });
    await contract.deploy({
      config: transactionConfig,
      constructorArgs: {
        nested_delegates: nestedDelegates,
      },
    });
    console.log(
      "   Deployed asset account:",
      chalk.green(contract.getContractId()),
    );
    return contract;
  };

  /**
   * Deploys one reusable recursive authorization node.
   *
   * Every instance has the same code but its own constructor-defined list of
   * immediate delegates, which lets the examples compose chains and branches.
   */
  const deployRecursive = async (
    nestedDelegates: string[],
  ): Promise<Contract> => {
    if (!recursiveTemplate) {
      throw new Error(
        "This example did not prepare the recursive delegate contract",
      );
    }
    const contract = new Contract({
      networkConfig,
      rpc,
      contractConfig: {
        wasmHash: recursiveTemplate.getWasmHash(),
        spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
      },
    });
    await contract.deploy({
      config: transactionConfig,
      constructorArgs: {
        nested_delegates: nestedDelegates,
      },
    });
    console.log(
      "   Deployed recursive node:",
      chalk.green(contract.getContractId()),
    );
    return contract;
  };

  /**
   * Creates an off-chain leaf node.
   *
   * The address tells Colibri which delegated node this signer represents. The
   * wrapped `LocalSigner` supplies the Ed25519 signature that ends the branch.
   */
  const leafSigner = (index: number): DelegatedSigner =>
    new DelegatedSigner({
      address: leaves[index].publicKey(),
      signer: leaves[index],
    });

  /**
   * Creates an off-chain contract node.
   *
   * Contract nodes do not sign with a private key. Their nested signers mirror
   * the delegates the contract will validate in `__check_auth`.
   */
  const contractSigner = (
    address: ContractId,
    nestedDelegates: DelegatedSigner[],
  ): DelegatedSigner =>
    new DelegatedSigner({
      address,
      nestedDelegates,
    });

  /**
   * Funds the top-level contract account and invokes its protected withdrawal.
   *
   * The call deliberately supplies both authorization domains:
   * - `admin` signs the outer transaction envelope;
   * - `signer` authorizes the contract account and owns the entire nested tree.
   */
  const withdraw = async (
    account: Contract,
    signer: DelegatedSigner,
  ): Promise<void> => {
    const xlm = StellarAssetContract.NativeXLM(networkConfig);
    const contractId = account.getContractId();

    console.log("\n5. Funding the top-level contract account...");
    console.log("   Contract account:", chalk.green(contractId));
    console.log("   Deposit:         ", chalk.green(DEPOSIT), "stroops");

    // Native XLM is represented inside Soroban by its Stellar Asset Contract
    // (SAC). This transfer gives the custom account an on-chain XLM balance.
    await xlm.transfer({
      from: admin.publicKey(),
      to: contractId,
      amount: DEPOSIT,
      config: transactionConfig,
    });
    const before = await xlm.balance({ id: contractId });

    console.log("\n6. Invoking the delegated withdrawal...");
    // The recording simulation discovers that `withdraw` calls `require_auth`
    // for the contract account. Colibri matches that entry with `signer`,
    // recursively adds delegated credentials, and performs enforcing simulation
    // before the final transaction can be assembled and submitted.
    const result = await account.invoke({
      method: "withdraw",
      methodArgs: {
        token: xlm.contractId,
        to: recipient.publicKey(),
        amount: WITHDRAWAL,
      },
      config: {
        ...transactionConfig,
        signers: [admin, signer],
      },
    });
    const after = await xlm.balance({ id: contractId });

    console.log("\n7. Confirming the result...");
    console.log("   Withdrawal transaction:", chalk.green(result.hash));
    console.log("   Balance before:", chalk.green(before), "stroops");
    console.log("   Balance after: ", chalk.green(after), "stroops");
    console.log(
      chalk.yellow(
        "   Colibri assembled the delegated tree and completed enforcing simulation before submission.",
      ),
    );
  };

  return {
    leaves,
    deployAssetAccount,
    deployRecursive,
    leafSigner,
    contractSigner,
    withdraw,
  };
}
