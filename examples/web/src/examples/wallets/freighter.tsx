import { useState } from "react";
import { isConnected } from "@stellar/freighter-api";
import { useConnect, useConnection, useDisconnect } from "@colibri/react";
import { Actions, Failure, Note, Value } from "../../components/lesson.tsx";

export default function Freighter() {
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connection = useConnection();
  const [error, setError] = useState<unknown>();
  const [checking, setChecking] = useState(false);

  async function requestAccess() {
    setError(undefined);
    setChecking(true);
    try {
      // Check extension availability before requesting access. Without an
      // installed extension, its access prompt cannot answer the request.
      const availability = await isConnected();
      if (!availability.isConnected) {
        throw new Error(
          "Install Freighter in this browser, then reload this page.",
        );
      }

      // This connector calls the supplied Freighter API, bypassing Kit UI.
      // Its setup file imports the real upstream SDK rather than copying types.
      await connect("freighter");
    } catch (cause) {
      setError(cause);
    } finally {
      setChecking(false);
    }
  }
  async function release() {
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
        Install Freighter and select Testnet. The direct adapter exposes
        transaction-envelope signing and polls authorized account/network
        changes. Disconnect clears Colibri authority; it does not revoke the
        extension's website permission.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={checking || connection.status === "connecting"}
          onClick={() => void requestAccess()}
        >
          Connect directly to Freighter
        </button>
        <button
          type="button"
          className="secondary"
          disabled={connection.status === "disconnected"}
          onClick={() => void release()}
        >
          Disconnect
        </button>
      </Actions>
      <Failure error={error} />
      <Value label="Status">{connection.status}</Value>
      <Value label="Connector">{connection.connectorId ?? "—"}</Value>
      <Value label="Address">{connection.connection?.address ?? "—"}</Value>
    </>
  );
}
