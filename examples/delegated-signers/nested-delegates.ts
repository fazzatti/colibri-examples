/**
 * Routes authorization through two nested recursive contracts before reaching
 * an Ed25519 leaf signer.
 *
 * This example proves that delegation is genuinely recursive rather than
 * limited to one intermediate contract. Each contract sees and validates only
 * its immediate delegate. Colibri's nested signer tree carries enough
 * information to assemble the full credential tree required by the network.
 *
 * Topology:
 * DelegatedAssetAccount
 *   -> RecursiveDelegateAccount
 *     -> RecursiveDelegateAccount
 *       -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

// Prepare one leaf account and the templates needed to deploy three contract
// instances: the asset account plus two recursive authorization nodes.
const example = await prepareDelegatedExample({
  title: "Deeply nested delegated authorization",
  leafCount: 1,
  includeRecursiveContract: true,
});

// The deepest node is the only one backed by a secret key.
const leaf = example.leafSigner(0);

// Build the on-chain chain from the inside out. The inner contract delegates to
// the G... account...
const innerDelegate = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);

// ...the outer contract delegates to the inner contract...
const outerDelegate = await example.deployRecursive([
  innerDelegate.getContractId(),
]);

// ...and the asset-owning account delegates to the outer contract.
const assetAccount = await example.deployAssetAccount([
  outerDelegate.getContractId(),
]);

// Now mirror those same three edges off-chain, again from the leaf upward.
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

// Colibri receives only `accountSigner`. It recursively authorizes the nested
// tree, then enforcing simulation makes every contract validate its layer.
await example.withdraw(assetAccount, accountSigner);
