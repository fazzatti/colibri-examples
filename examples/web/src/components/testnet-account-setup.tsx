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
          : "Connect a Testnet wallet using the header.")}
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
