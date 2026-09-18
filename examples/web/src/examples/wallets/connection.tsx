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
