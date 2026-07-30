/**
 * Authorizes a contract account directly with one Ed25519 delegate.
 *
 * Topology:
 * DelegatedAssetAccount -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

const example = await prepareDelegatedExample({
  title: "Direct delegated authorization",
  leafCount: 1,
  includeRecursiveContract: false,
});

const leaf = example.leafSigner(0);
const assetAccount = await example.deployAssetAccount([
  example.leaves[0].publicKey(),
]);
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [leaf],
);

await example.withdraw(assetAccount, accountSigner);
