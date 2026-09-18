/**
 * Connect and disconnect an external wallet with the combined useWallet hook.
 *
 * Install Freighter, select Testnet, then connect through the registered Wallets
 * Kit connector. Follow the click handler into wallet.connect(), and observe how
 * the same hook exposes status, address and signers. This uses the app provider,
 * so the header and other wallet lessons see the same connection. Connecting
 * requests access to an identity; funding and transaction approval are separate
 * steps. connection.tsx shows the individual hooks behind this convenience API.
 *
 * @module
 */
import { useState } from "react";
import { useWallet } from "@colibri/react/wallet";
import {
  Actions,
  Note,
  Value,
  WalletFailure,
} from "../../components/lesson.tsx";

export default function Wallet() {
  // Observe the nearest provider rather than keeping a second address/status
  // in local state. This keeps the lesson and header aligned on disconnect or
  // wallet changes; only a caught action error belongs to this component.
  const wallet = useWallet();
  const [error, setError] = useState<unknown>();

  async function connect() {
    setError(undefined);
    try {
      // The explicit ID opens Wallets Kit's modal. The provider never prompts
      // during rendering. A different wallet network throws REACT_007.
      // WalletFailure explains how to switch to Testnet; we do not bypass
      // the passphrase guard or silently change the wallet network.
      await wallet.connect("stellar-wallets-kit");
    } catch (cause) {
      setError(cause);
    }
  }

  async function disconnect() {
    setError(undefined);
    try {
      // Release this app's connection and guarded signers. This does not erase
      // the wallet's keys or revoke the extension's permission for this site.
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
        Wallet connectivity lesson explains how to add more modules.
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
      <WalletFailure error={error ?? wallet.error} />
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
