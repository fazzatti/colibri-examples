import { useState } from "react";
import { useWallet } from "@colibri/react/wallet";
import { Spinner, WalletFailure } from "./lesson.tsx";

// This sits outside every lesson's local provider. It always represents the
// actual wallet and lets a reader connect without navigating away from setup.
export function WalletControl() {
  const wallet = useWallet();
  const [error, setError] = useState<unknown>();
  async function toggle() {
    setError(undefined);
    try {
      if (wallet.status === "connected") await wallet.disconnect();
      else await wallet.connect("stellar-wallets-kit");
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <div className="wallet-control">
      {wallet.address && (
        <span className="wallet-status" title={wallet.address}>
          {wallet.address.slice(0, 5)}…{wallet.address.slice(-4)}
        </span>
      )}
      <button
        type="button"
        className="secondary"
        disabled={wallet.status === "connecting"}
        onClick={() => void toggle()}
      >
        {wallet.status === "connecting" && <Spinner />}
        {wallet.status === "connected" ? "Disconnect wallet" : "Connect wallet"}
      </button>
      <WalletFailure error={error ?? wallet.error} />
    </div>
  );
}
