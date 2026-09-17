import { useColibriConfig, useNetwork } from "@colibri/react";
import { useLatestLedger, useRpc } from "@colibri/react/rpc";
import {
  Actions,
  Data,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

export default function NetworkOverview() {
  // These accessors return the provider's existing objects, not new connections.
  const config = useColibriConfig();
  const network = useNetwork();
  const rpc = useRpc();

  // Polling is opt-in. Leaving this lesson removes its query observer.
  const ledger = useLatestLedger({ refetchInterval: 5000 });

  return (
    <>
      <Note>
        Start here. Public RPC reads need no wallet. All examples use Stellar
        Testnet; its assets have no monetary value.
      </Note>
      <div className="values">
        <Value label="Network">Testnet</Value>
        <Value label="RPC endpoint">{rpc.serverURL.toString()}</Value>
      </div>
      <Value label="Network passphrase">{network.networkPassphrase}</Value>
      <Actions>
        <button
          type="button"
          onClick={() => void ledger.refetch()}
          disabled={ledger.isFetching}
        >
          Refresh ledger
        </button>
        <a className="button secondary" href="#wallet">
          Next: connect a wallet →
        </a>
      </Actions>
      <QueryState query={ledger}>
        {ledger.data && (
          <>
            <Value label="Latest ledger">
              {ledger.data.sequence.toLocaleString()}
            </Value>
            <Data value={ledger.data} />
          </>
        )}
      </QueryState>
      <p className="muted">
        Provider scope:{" "}
        <code>{config.scope}</code>. One provider stays mounted as you move
        between lessons.
      </p>
    </>
  );
}
