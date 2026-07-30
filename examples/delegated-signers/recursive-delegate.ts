/**
 * Routes authorization through one recursive contract before reaching an
 * Ed25519 leaf signer.
 *
 * Unlike the direct example, the top-level asset account does not delegate to
 * the signing account itself. It delegates to another contract account. That
 * contract runs its own `__check_auth`, delegates again, and only then reaches
 * the Ed25519 account that can produce a signature.
 *
 * The application must mirror every on-chain edge with nested
 * `DelegatedSigner` instances. Only the completed top-level signer is supplied
 * to the pipeline.
 *
 * Topology:
 * DelegatedAssetAccount -> RecursiveDelegateAccount -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

// This topology needs one leaf account and the reusable recursive-contract WASM.
const example = await prepareDelegatedExample({
  title: "Recursive delegated authorization",
  leafCount: 1,
  includeRecursiveContract: true,
});

// The Ed25519 leaf owns the secret key that terminates the delegated branch.
const leaf = example.leafSigner(0);

// First deploy the intermediate contract and configure its on-chain policy to
// delegate to the leaf account.
const recursiveDelegate = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);

// Then deploy the asset-owning account and configure it to delegate to the
// intermediate contract. Together these constructors create the on-chain tree.
const assetAccount = await example.deployAssetAccount([
  recursiveDelegate.getContractId(),
]);

// Recreate the same tree off-chain from the bottom up. The recursive contract
// node owns no secret; it contains the leaf that can authorize its branch.
const recursiveSigner = example.contractSigner(
  recursiveDelegate.getContractId(),
  [leaf],
);

// The asset-account node becomes the single top-level delegated signer that the
// transaction pipeline receives.
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [recursiveSigner],
);

// During enforcing simulation, Stellar executes both contracts'
// `__check_auth` functions and verifies the leaf signature.
await example.withdraw(assetAccount, accountSigner);
