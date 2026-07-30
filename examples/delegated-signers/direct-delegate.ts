/**
 * Authorizes a contract account directly with one Ed25519 delegate.
 *
 * A delegated authorization topology exists in two places:
 *
 * 1. On-chain, the contract stores the addresses it trusts as immediate
 *    delegates.
 * 2. Off-chain, the application builds the matching `DelegatedSigner` tree so
 *    Colibri knows how each branch will be authorized.
 *
 * This is the smallest possible delegated topology. The contract delegates
 * directly to a funded Stellar account, whose local key signs the authorization
 * payload and ends the branch.
 *
 * Topology:
 * DelegatedAssetAccount -> G... leaf signer
 */
import { prepareDelegatedExample } from "./shared.ts";

// Prepare disposable Testnet identities and upload only the asset-account WASM.
// There is no recursive contract in this direct example.
const example = await prepareDelegatedExample({
  title: "Direct delegated authorization",
  leafCount: 1,
  includeRecursiveContract: false,
});

// A leaf is an ordinary Ed25519 account. Its `LocalSigner` owns the secret key
// that will produce the final signature for this authorization branch.
const leaf = example.leafSigner(0);

// Configure the on-chain account to accept that G... address as its only
// immediate delegate. The constructor fixes the contract's authorization
// policy for this demonstration.
const assetAccount = await example.deployAssetAccount([
  example.leaves[0].publicKey(),
]);

// Mirror the same relationship off-chain. The top-level node represents the
// contract account, while its nested leaf knows how to sign.
const accountSigner = example.contractSigner(
  assetAccount.getContractId(),
  [leaf],
);

// Fund the contract with XLM, invoke its protected withdrawal, and let Colibri
// discover, assemble, enforce, envelope-sign, and submit the transaction.
await example.withdraw(assetAccount, accountSigner);
