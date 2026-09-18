import { useEffect, useState } from "react";
import { useColibriConfig, useNetwork } from "@colibri/react";
import { useLatestLedger, useRpc } from "@colibri/react/rpc";
import {
  Actions,
  Data,
  Note,
  QueryState,
  Spinner,
  Value,
} from "../../components/lesson.tsx";

export default function NetworkOverview() {
  // These hooks expose configuration and a memoized RPC client without
  // making a request. useLatestLedger below performs the data fetch.
  const config = useColibriConfig();
  const network = useNetwork();
  const rpc = useRpc();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [seconds, setSeconds] = useState(5);

  // Fetch once on entry. This lesson owns its visible refresh schedule so
  // focus, reconnection and retries cannot cause unexplained extra requests.
  const ledger = useLatestLedger({
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const { isFetching, refetch, fetchStatus } = ledger;

  // Start the next five-second wait after a request settles. The countdown
  // and refetch share one clock. Turning the option off or leaving the page
  // clears it, and an in-flight manual refresh resets the next wait.
  useEffect(() => {
    setSeconds(5);
    if (!autoRefresh || isFetching || fetchStatus === "paused") return;
    const deadline = Date.now() + 5000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        void refetch();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [autoRefresh, isFetching, refetch, fetchStatus]);

  return (
    <>
      <Note>
        useColibriConfig, useNetwork and useRpc read provider configuration.
        useLatestLedger makes the public RPC request below. No wallet is needed.
      </Note>
      <div className="values">
        <Value label="Network">Testnet</Value>
        <Value label="RPC endpoint">{rpc.serverURL.toString()}</Value>
      </div>
      <Value label="Network passphrase">{network.networkPassphrase}</Value>
      <Actions>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching && <Spinner />}
          {isFetching ? "Refreshing ledger…" : "Refresh ledger"}
        </button>
      </Actions>
      <label className="refresh-option">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(event) => setAutoRefresh(event.target.checked)}
        />
        Auto-refresh every 5 seconds
      </label>
      <p className="refresh-status">
        {fetchStatus === "paused"
          ? "Request paused while offline. It will resume when the connection returns."
          : isFetching
          ? "Request in progress…"
          : autoRefresh
          ? `Next refresh in ${seconds} seconds.`
          : "Automatic refresh is off. Use Refresh ledger to request an update."}
      </p>
      <QueryState query={ledger}>
        {ledger.data && (
          <>
            <Value label="Latest ledger">
              {ledger.data.sequence.toLocaleString()}
            </Value>
            <Value label="Last successful read">
              {new Date(ledger.dataUpdatedAt).toLocaleTimeString()}
            </Value>
            <Data value={ledger.data} />
          </>
        )}
      </QueryState>
      <p className="muted">
        Provider scope:{" "}
        <code>{config.scope}</code>. The provider remains mounted across
        lessons, preserving the network configuration and query cache.
      </p>
    </>
  );
}
