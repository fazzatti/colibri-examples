/**
 * Requires two parallel recursive branches, each ending in its own Ed25519
 * leaf signer.
 *
 * Topology:
 * DelegatedAssetAccount
 *   -> RecursiveDelegateAccount A -> G... leaf signer A
 *   -> RecursiveDelegateAccount B -> G... leaf signer B
 */
import { prepareDelegatedExample } from "./shared.ts";

const example = await prepareDelegatedExample({
  title: "Branching delegated authorization",
  leafCount: 2,
  includeRecursiveContract: true,
});

const leafA = example.leafSigner(0);
const leafB = example.leafSigner(1);
const branchA = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);
const branchB = await example.deployRecursive([
  example.leaves[1].publicKey(),
]);
const assetAccount = await example.deployAssetAccount([
  branchA.getContractId(),
  branchB.getContractId(),
]);

const branchSignerA = example.contractSigner(
  branchA.getContractId(),
  [leafA],
);
const branchSignerB = example.contractSigner(
  branchB.getContractId(),
  [leafB],
);
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [branchSignerA, branchSignerB],
);

await example.withdraw(assetAccount, accountSigner);
