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
