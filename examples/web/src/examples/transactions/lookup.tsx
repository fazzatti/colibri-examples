import { useState } from "react";
import { useTransaction } from "@colibri/react/rpc";
import {
  Actions,
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

export default function TransactionLookup() {
  const initial =
    new URLSearchParams(location.hash.split("?")[1]).get("hash") ?? "";
  const [input, setInput] = useState(initial);
  const hash = /^[a-fA-F0-9]{64}$/.test(input) ? input : undefined;

  // Lookup observes a hash; it neither signs nor submits anything.
  const transaction = useTransaction(hash);
  return (
    <>
      <Note>
        Paste a recent Testnet transaction hash. NOT_FOUND may mean pending,
        expired RPC retention, or an unknown hash; it does not prove failure.
      </Note>
      <Field
        label="Transaction hash"
        value={input}
        onChange={(event) => setInput(event.target.value.trim())}
        placeholder="64 hexadecimal characters"
      />
      <Actions>
        <button
          type="button"
          disabled={!hash || transaction.isFetching}
          onClick={() => void transaction.refetch()}
        >
          Refresh transaction
        </button>
        {hash && (
          <a className="button secondary" href={`#confirmation?hash=${hash}`}>
            Wait for confirmation →
          </a>
        )}
      </Actions>
      <QueryState query={transaction}>
        {transaction.data && (
          <>
            <Value label="RPC status">{transaction.data.status}</Value>
            <Data value={transaction.data} />
          </>
        )}
      </QueryState>
    </>
  );
}
