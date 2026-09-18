/**
 * Look up a recent Testnet transaction by hash with useTransaction.
 *
 * Paste a 64-character hexadecimal hash, or arrive through an invocation's
 * Inspect transaction link. A valid hash enables the public RPC query; Refresh
 * requests the latest known result. Follow the confirmation link to observe it
 * repeatedly in confirmation.tsx. SUCCESS, FAILED and NOT_FOUND are RPC results,
 * not local wallet states. In particular, NOT_FOUND alone does not establish
 * failure: the transaction may be pending, unknown or outside RPC retention.
 *
 * @module
 */
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
  // Invocation pages link here using a hash-route query parameter. This is a
  // public transaction identifier, so it can also be pasted without retaining
  // any wallet state or result object from the originating lesson.
  const initial =
    new URLSearchParams(location.hash.split("?")[1]).get("hash") ?? "";
  const [input, setInput] = useState(initial);

  // Do not send partial input to RPC. Validation checks hash syntax only;
  // a complete hexadecimal hash may still be unknown on the configured network.
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
