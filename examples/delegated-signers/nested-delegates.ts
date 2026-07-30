/**
 * Routes authorization through two nested recursive contracts before reaching
 * an Ed25519 leaf signer.
 *
 * Topology:
 * DelegatedAssetAccount
 *   -> RecursiveDelegateAccount
 *     -> RecursiveDelegateAccount
 *       -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

const example = await prepareDelegatedExample({
  title: "Deeply nested delegated authorization",
  leafCount: 1,
  includeRecursiveContract: true,
});

const leaf = example.leafSigner(0);
const innerDelegate = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);
const outerDelegate = await example.deployRecursive([
  innerDelegate.getContractId(),
]);
const assetAccount = await example.deployAssetAccount([
  outerDelegate.getContractId(),
]);

const innerSigner = example.contractSigner(
  innerDelegate.getContractId(),
  [leaf],
);
const outerSigner = example.contractSigner(
  outerDelegate.getContractId(),
  [innerSigner],
);
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [outerSigner],
);

await example.withdraw(assetAccount, accountSigner);
