/**
 * Exercise connection state and actions as separate Colibri hooks.
 *
 * useConnection observes the provider while useConnect, useReconnect and
 * useDisconnect supply explicit actions. Try an interactive connection first,
 * then compare it with silent reconnection when the adapter has an identity to
 * restore. A missing cached identity is an expected result. This lesson uses
 * the same external-wallet provider as the header and never signs a transaction;
 * wallet.tsx demonstrates the combined useWallet API for the same workflow.
 *
 * @module
 */
import { useState } from "react";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useReconnect,
} from "@colibri/react";
import {
  Actions,
  Note,
  Value,
  WalletFailure,
} from "../../components/lesson.tsx";

export default function Connection() {
  // State observation is independent of the action functions. Read the
  // provider snapshot after an action; do not invent a second connected flag
  // that could outlive an account or network change.
  const state = useConnection();
  const connect = useConnect();
  const reconnect = useReconnect();
  const disconnect = useDisconnect();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>();

  async function openWallet() {
    setError(undefined);
    setMessage("");
    try {
      // Use the connector ID registered in app/provider.tsx. The Kit owns its
      // selection UI; Colibri checks the returned wallet network against Testnet.
      // WalletFailure below turns REACT_007 into instructions to switch networks.
      await connect("stellar-wallets-kit");
    } catch (cause) {
      setError(cause);
    }
  }
  async function restoreWallet() {
    setError(undefined);
    try {
      // Reconnect reads cached identity without opening UI. A null response is
      // expected when no identity is available or the module was changed.
      const restored = await reconnect("stellar-wallets-kit");
      setMessage(
        restored
          ? "Cached connection restored."
          : "Nothing to restore. Use Connect.",
      );
    } catch (cause) {
      setError(cause);
    }
  }
  async function closeWallet() {
    setError(undefined);
    try {
      // Disconnect clears authority in this provider. It is a separate action
      // from silent reconnection, and does not remove wallet keys or permissions.
      await disconnect();
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <>
      <Note>
        These are the primitives composed by useWallet. After a wallet or
        network change, Colibri clears authority; reconnect explicitly when
        appropriate.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={state.status === "connecting"}
          onClick={() => void openWallet()}
        >
          Connect
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.status === "connecting"}
          onClick={() => void restoreWallet()}
        >
          Reconnect silently
        </button>
        <button
          type="button"
          className="secondary"
          disabled={state.status === "disconnected"}
          onClick={() => void closeWallet()}
        >
          Disconnect
        </button>
      </Actions>
      <WalletFailure error={error ?? state.error} />
      <p aria-live="polite">{message}</p>
      <Value label="State">{state.status}</Value>
      <Value label="Address">{state.connection?.address ?? "—"}</Value>
    </>
  );
}
