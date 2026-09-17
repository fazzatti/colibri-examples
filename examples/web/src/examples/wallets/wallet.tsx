import { useState } from "react";
import { useWallet } from "@colibri/react/wallet";
import { Actions, Failure, Note, Value } from "../../components/lesson.tsx";

export default function Wallet() {
  const wallet = useWallet();
  const [error, setError] = useState<unknown>();

  async function connect() {
    setError(undefined);
    try {
      // The explicit ID opens Wallets Kit's modal. The provider never prompts
      // during rendering, and rejects accounts on a different network.
      await wallet.connect("stellar-wallets-kit");
    } catch (cause) {
      setError(cause);
    }
  }

  async function disconnect() {
    setError(undefined);
    try {
      await wallet.disconnect();
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <>
      <Note>
        Install Freighter, select Testnet in the extension, then connect through
        Wallets Kit. This app initializes the Kit with its Freighter module. The
        ecosystem lesson explains how to add more modules.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={wallet.status === "connecting"}
          onClick={() => void connect()}
        >
          Connect with Wallets Kit
        </button>
        <button
          type="button"
          className="secondary"
          disabled={wallet.status === "disconnected"}
          onClick={() => void disconnect()}
        >
          Disconnect
        </button>
      </Actions>
      <Failure error={error} />
      <div className="result" aria-live="polite">
        <Value label="Connection">{wallet.status}</Value>
        <Value label="Account">
          {wallet.address ?? "No account connected"}
        </Value>
        <Value label="Connector">{wallet.connectorId ?? "—"}</Value>
        <Value label="Signer capabilities">{wallet.signers.length}</Value>
      </div>
      <p>
        Connecting exposes an address and supported signing capabilities. It
        does not fund an account or authorize a transaction.
      </p>
    </>
  );
}
