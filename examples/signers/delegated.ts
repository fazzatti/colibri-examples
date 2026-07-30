/**
 * Deploys and exercises four delegated authorization topologies on Testnet.
 *
 * The leaf `G...` addresses are funded so Stellar can resolve their account
 * signer weights while enforcing the delegated authorization tree.
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
import { fund, networkConfig, rpc } from "./shared.ts";

type Topology = {
  name: string;
  contract: Contract;
  signer: DelegatedSigner;
};

const DEPOSIT = 2_0000000n;
const WITHDRAWAL = 1_0000000n;

console.log(
  chalk.bgBlue("Recursive delegated authorization example on Stellar Testnet"),
);

const latestLedger = await rpc.getLatestLedger();
if (Number(latestLedger.protocolVersion) < 27) {
  throw new Error(
    `Delegated authorization requires Protocol 27; Testnet reports ${latestLedger.protocolVersion}`,
  );
}

const admin = LocalSigner.generateRandom();
const recipient = LocalSigner.generateRandom();
const leaves = [
  LocalSigner.generateRandom(),
  LocalSigner.generateRandom(),
];

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

console.log("Uploading the two reusable contract WASMs...");
const recursiveTemplate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasm: await loadWasm("recursive_delegate_account_contract.wasm"),
    spec: RECURSIVE_DELEGATE_ACCOUNT_SPEC,
  },
});
await recursiveTemplate.uploadWasm(transactionConfig);

const assetTemplate = new Contract({
  networkConfig,
  rpc,
  contractConfig: {
    wasm: await loadWasm("delegated_asset_account_contract.wasm"),
    spec: DELEGATED_ASSET_ACCOUNT_SPEC,
  },
});
await assetTemplate.uploadWasm(transactionConfig);

const deployRecursive = async (
  nestedDelegates: string[],
): Promise<Contract> => {
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

const leafNode = (index: number): DelegatedSigner =>
  new DelegatedSigner({
    address: leaves[index].publicKey(),
    signer: leaves[index],
  });

const contractNode = (
  address: ContractId,
  nestedDelegates: DelegatedSigner[],
): DelegatedSigner =>
  new DelegatedSigner({
    address,
    nestedDelegates,
  });

const topology = (
  name: string,
  contract: Contract,
  nestedDelegates: DelegatedSigner[],
): Topology => ({
  name,
  contract,
  signer: contractNode(contract.getContractId(), nestedDelegates),
});

console.log("Deploying a top-level account with one direct delegate...");
const directAccount = await deployAssetAccount([leaves[0].publicKey()]);
const direct = topology(
  "one direct Ed25519 delegate",
  directAccount,
  [leafNode(0)],
);

console.log("Deploying one recursive contract delegate...");
const recursiveLeaf = await deployRecursive([leaves[0].publicKey()]);
const recursiveAccount = await deployAssetAccount([
  recursiveLeaf.getContractId(),
]);
const recursive = topology(
  "one recursive contract delegate",
  recursiveAccount,
  [contractNode(recursiveLeaf.getContractId(), [leafNode(0)])],
);

console.log("Deploying a deep recursive delegate chain...");
const deepLeaf = await deployRecursive([leaves[0].publicKey()]);
const deepRoot = await deployRecursive([deepLeaf.getContractId()]);
const deepAccount = await deployAssetAccount([deepRoot.getContractId()]);
const deep = topology(
  "a deep delegate chain",
  deepAccount,
  [
    contractNode(deepRoot.getContractId(), [
      contractNode(deepLeaf.getContractId(), [leafNode(0)]),
    ]),
  ],
);

console.log("Deploying a branching recursive topology...");
const branchA = await deployRecursive([leaves[0].publicKey()]);
const branchB = await deployRecursive([leaves[1].publicKey()]);
const branchAccount = await deployAssetAccount([
  branchA.getContractId(),
  branchB.getContractId(),
]);
const branching = topology(
  "a branching contract hierarchy",
  branchAccount,
  [
    contractNode(branchA.getContractId(), [leafNode(0)]),
    contractNode(branchB.getContractId(), [leafNode(1)]),
  ],
);

const xlm = StellarAssetContract.NativeXLM(networkConfig);
const topologies = [direct, recursive, deep, branching];

for (const current of topologies) {
  const contractId = current.contract.getContractId();
  console.log(`\n${chalk.bold(current.name)}`);
  console.log("Top-level account:", chalk.green(contractId));

  await xlm.transfer({
    from: admin.publicKey(),
    to: contractId,
    amount: DEPOSIT,
    config: transactionConfig,
  });
  const before = await xlm.balance({ id: contractId });

  const result = await current.contract.invoke({
    method: "withdraw",
    methodArgs: {
      token: xlm.contractId,
      to: recipient.publicKey(),
      amount: WITHDRAWAL,
    },
    config: {
      ...transactionConfig,
      signers: [admin, current.signer],
    },
  });
  const after = await xlm.balance({ id: contractId });

  console.log("Withdrawal transaction:", chalk.green(result.hash));
  console.log("Balance before:", chalk.green(before), "stroops");
  console.log("Balance after: ", chalk.green(after), "stroops");
}

console.log(
  chalk.yellow(
    "Each withdrawal records authorization, adds the delegated tree, and runs enforcing simulation before submission.",
  ),
);
