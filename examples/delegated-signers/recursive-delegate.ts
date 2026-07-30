/**
 * Routes authorization through one recursive contract before reaching an
 * Ed25519 leaf signer.
 *
 * Topology:
 * DelegatedAssetAccount -> RecursiveDelegateAccount -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

const example = await prepareDelegatedExample({
  title: "Recursive delegated authorization",
  leafCount: 1,
  includeRecursiveContract: true,
});

const leaf = example.leafSigner(0);
const recursiveDelegate = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);
const assetAccount = await example.deployAssetAccount([
  recursiveDelegate.getContractId(),
]);
const recursiveSigner = example.contractSigner(
  recursiveDelegate.getContractId(),
  [leaf],
);
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [recursiveSigner],
);

await example.withdraw(assetAccount, accountSigner);
