/**
 * Provide reusable Testnet funding controls without hiding lesson hook calls.
 *
 * The parent lesson owns useAccount and passes its selected address and query
 * here. Check account refetches that observation; Fund with Friendbot creates
 * and funds the Testnet account, waits for RPC visibility, then refetches it.
 * The lesson gates submission on the query's success. Parents key this component
 * by address so a new source or recipient gets fresh setup feedback. Funding
 * never generates/replaces the signer and remains an explicit user action.
 *
 * @module
 */
import { useState } from "react";
import { initializeWithFriendbot } from "@colibri/core";
import { useNetwork } from "@colibri/react";
import type { useAccount } from "@colibri/react/accounts";
import { Actions, Failure, Spinner, Value } from "./lesson.tsx";

// Incidental setup shared by wallet transaction examples. The lesson itself
// still reads the account and invokes its transaction hook directly.
export function TestnetAccountSetup(
  { address, account, label = "Wallet source" }: {
    address: `G${string}` | undefined;
    account: ReturnType<typeof useAccount>;
    label?: string;
  },
) {
  const network = useNetwork();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  async function fund() {
    if (!address || !network.friendbotUrl) return;
    setPending(true);
    setError(undefined);
    try {
      // Connecting a wallet reveals a public key, not proof of a ledger
      // account. Wait for funding to reach RPC before re-reading its state.
      await initializeWithFriendbot(network.friendbotUrl, address, {
        rpcUrl: network.rpcUrl,
      });
      await account.refetch();
    } catch (cause) {
      // Keep the selected address and signer intact on a failed/rate-limited
      // funding request. The reader can check RPC state or retry funding without
      // accidentally creating a different identity.
      setError(cause);
    } finally {
      setPending(false);
    }
  }
  return (
    <fieldset className="lesson-step">
      <legend>{label} setup</legend>
      <Value label="G-address">
        {address ?? (label === "Recipient"
          ? "Enter or generate a recipient above."
          : "Choose a signer above.")}
      </Value>
      <p role="status">
        {account.isFetching
          ? "Checking the account through RPC…"
          : account.isSuccess
          ? "Account exists on Testnet."
          : "Check that this account exists on Testnet, or create and fund it with Friendbot here before submitting."}
      </p>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={!address || pending || account.isFetching}
          onClick={() => void fund()}
        >
          {pending && <Spinner />}
          {pending ? "Funding and waiting for RPC…" : "Fund with Friendbot"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!address || pending || account.isFetching}
          onClick={() => void account.refetch()}
        >
          Check account
        </button>
      </Actions>
      <Failure error={error ?? account.error} />
    </fieldset>
  );
}
