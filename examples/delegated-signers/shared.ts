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

const DEPOSIT = 2_0000000n;
const WITHDRAWAL = 1_0000000n;

type PrepareDelegatedExampleOptions = {
  title: string;
  leafCount: number;
  includeRecursiveContract: boolean;
};

/**
 * Creates the disposable Testnet identities and reusable contract templates
 * needed by one delegated authorization example.
 */
export async function prepareDelegatedExample(
  options: PrepareDelegatedExampleOptions,
) {
  console.log(chalk.bgBlue(`${options.title} on Stellar Testnet`));

  const latestLedger = await rpc.getLatestLedger();
  if (Number(latestLedger.protocolVersion) < 27) {
    throw new Error(
      `Delegated authorization requires Protocol 27; Testnet reports ${latestLedger.protocolVersion}`,
    );
  }

  const admin = LocalSigner.generateRandom();
  const recipient = LocalSigner.generateRandom();
  const leaves = Array.from(
    { length: options.leafCount },
    () => LocalSigner.generateRandom(),
  );

  await fund(admin, recipient, ...leaves);

  const transactionConfig: TransactionConfig = {
    source: admin.publicKey(),
    fee: "10000000",
    timeout: 120,
    signers: [admin],
  };

  const loadWasm = async (name: string): Promise<Uint8Array> =>
    await Deno.readFile(
      new URL(`./contracts/artifacts/${name}`, import.meta.url),
    );

  console.log("Uploading the delegated asset account WASM...");
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
    console.log("Uploading the recursive delegate account WASM...");
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
    return contract;
  };

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
    return contract;
  };

  const leafSigner = (index: number): DelegatedSigner =>
    new DelegatedSigner({
      address: leaves[index].publicKey(),
      signer: leaves[index],
    });

  const contractSigner = (
    address: ContractId,
    nestedDelegates: DelegatedSigner[],
  ): DelegatedSigner =>
    new DelegatedSigner({
      address,
      nestedDelegates,
    });

  const withdraw = async (
    account: Contract,
    signer: DelegatedSigner,
  ): Promise<void> => {
    const xlm = StellarAssetContract.NativeXLM(networkConfig);
    const contractId = account.getContractId();

    console.log("Top-level account:", chalk.green(contractId));

    await xlm.transfer({
      from: admin.publicKey(),
      to: contractId,
      amount: DEPOSIT,
      config: transactionConfig,
    });
    const before = await xlm.balance({ id: contractId });

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

    console.log("Withdrawal transaction:", chalk.green(result.hash));
    console.log("Balance before:", chalk.green(before), "stroops");
    console.log("Balance after: ", chalk.green(after), "stroops");
    console.log(
      chalk.yellow(
        "Colibri assembled the delegated tree and completed enforcing simulation before submission.",
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
