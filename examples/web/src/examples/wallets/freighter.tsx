/**
 * Connect directly to Freighter through its upstream SDK and Colibri adapter.
 *
 * Install the extension and select Testnet before requesting access. This lesson
 * first checks availability, then connects with the "freighter" connector ID
 * registered in app/provider.tsx. Inspect setup/freighter.ts for the adapter.
 * Unlike the Kit route, it has no wallet-selection modal and declares only
 * envelope signing. The connection still belongs to the shared app provider,
 * so its status and address also appear in the header.
 *
 * @module
 */
import { useState } from "react";
import { isConnected } from "@stellar/freighter-api";
import { useConnect, useConnection, useDisconnect } from "@colibri/react";
import {
  Actions,
  Note,
  Value,
  WalletFailure,
} from "../../components/lesson.tsx";

export default function Freighter() {
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connection = useConnection();
  const [error, setError] = useState<unknown>();

  // The availability probe happens before Colibri enters "connecting".
  // Keep the button busy across both stages to avoid overlapping prompts.
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
      // Clear the shared provider connection. The extension may still remember
      // site access, which is why a later explicit connection can be possible.
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
      <WalletFailure error={error ?? connection.error} />
      <Value label="Status">{connection.status}</Value>
      <Value label="Connector">{connection.connectorId ?? "—"}</Value>
      <Value label="Address">{connection.connection?.address ?? "—"}</Value>
    </>
  );
}
