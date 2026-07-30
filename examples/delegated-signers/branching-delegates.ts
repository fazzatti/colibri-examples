/**
 * Requires two parallel recursive branches, each ending in its own Ed25519
 * leaf signer.
 *
 * A delegated topology can branch as well as form a chain. The top-level asset
 * account in this example requires both immediate contract delegates. Each
 * branch then requires a different leaf signature. Supplying only one branch
 * would not satisfy the account's custom authorization policy.
 *
 * Topology:
 * DelegatedAssetAccount
 *   -> RecursiveDelegateAccount A -> G... leaf signer A
 *   -> RecursiveDelegateAccount B -> G... leaf signer B
 */
import { prepareDelegatedExample } from "./shared.ts";

// Two independent branches need two independently funded Ed25519 leaves.
const example = await prepareDelegatedExample({
  title: "Branching delegated authorization",
  leafCount: 2,
  includeRecursiveContract: true,
});

// Each leaf owns the secret key for exactly one branch.
const leafA = example.leafSigner(0);
const leafB = example.leafSigner(1);

// Deploy the two on-chain branches. Each recursive contract trusts a different
// G... address as its sole immediate delegate.
const branchA = await example.deployRecursive([
  example.leaves[0].publicKey(),
]);
const branchB = await example.deployRecursive([
  example.leaves[1].publicKey(),
]);

// The top-level asset account requires both branch contracts. Their order is
// mirrored below when the off-chain signer tree is assembled.
const assetAccount = await example.deployAssetAccount([
  branchA.getContractId(),
  branchB.getContractId(),
]);

// Build one off-chain node for each branch, pairing its contract address with
// the leaf that can sign for it.
const branchSignerA = example.contractSigner(
  branchA.getContractId(),
  [leafA],
);
const branchSignerB = example.contractSigner(
  branchB.getContractId(),
  [leafB],
);

// Join both branches beneath the top-level contract signer. This one object is
// the complete off-chain authorization topology supplied to Colibri.
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [branchSignerA, branchSignerB],
);

// Enforcing simulation succeeds only after both branches have been assembled
// and both leaf signatures have been verified.
await example.withdraw(assetAccount, accountSigner);
