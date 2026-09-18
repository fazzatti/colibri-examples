/**
 * Expose public Testnet fixtures and validate addresses entered in lessons.
 *
 * scripts/setup.ts writes the optional VITE_EXAMPLE_* identifiers; Vite exposes
 * those values to the browser. Keep secrets out of this module and environment
 * variables. Empty fixtures leave read forms available for manual input, while
 * contract lessons show setup instructions. The validators check address
 * encoding only: a valid key is not proof of a funded account or deployment.
 * The native XLM SAC address is derived for the configured network.
 *
 * @module
 */
import { Asset } from "@stellar/stellar-sdk";
import { StrKey } from "@colibri/core/strkey";
import { network } from "./network.ts";

// Optional setup writes only public Testnet identifiers into .env.local.
// Public-read lessons also accept manually entered addresses.
export const exampleAccount = import.meta.env.VITE_EXAMPLE_ACCOUNT ?? "";
export const exampleIssuer = import.meta.env.VITE_EXAMPLE_ISSUER ?? "";
export const exampleCounter = import.meta.env.VITE_EXAMPLE_COUNTER ?? "";
export const nativeToken = Asset.native().contractId(network.networkPassphrase);
export const authDomain = "127.0.0.1:8787";

export function accountId(value: string): `G${string}` | undefined {
  return StrKey.isValidEd25519PublicKey(value)
    ? value as `G${string}`
    : undefined;
}
export function contractId(value: string): `C${string}` | undefined {
  return StrKey.isValidContractId(value) ? value as `C${string}` : undefined;
}
