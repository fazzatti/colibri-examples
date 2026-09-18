/**
 * Observe a transaction until a terminal RPC status with useWaitForTransaction.
 *
 * Enter a recent Testnet hash or follow a lookup link, then explicitly start
 * waiting. The hook polls while the result is nonterminal and stops polling at
 * SUCCESS/FAILED; the page also provides a manual stop for an unresolved hash.
 * Stopping or leaving the page ends this observation, not the transaction on
 * the network. No wallet, signing or resubmission is involved. Use lookup.tsx
 * when an ordinary query with a manual refresh is enough.
 *
 * @module
 */
import { useState } from "react";
import { useWaitForTransaction } from "@colibri/react/rpc";
import {
  Actions,
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

export default function Confirmation() {
  const initial =
    new URLSearchParams(location.hash.split("?")[1]).get("hash") ?? "";
  const [input, setInput] = useState(initial);

  // Require an explicit start even when navigation supplies a hash. The input
  // is locked while watching, so the active poll cannot silently follow a
  // different transaction as the reader types.
  const [watching, setWatching] = useState(false);
  const hash = /^[a-fA-F0-9]{64}$/.test(input) ? input : undefined;

  // Polling stops at SUCCESS/FAILED. A hash can stay NOT_FOUND indefinitely,
  // so the user can also stop observation or leave this lesson.
  const transaction = useWaitForTransaction(hash, { enabled: watching });

  // watching is the reader's permission to observe, not proof a request is
  // currently running. The hook can have reached SUCCESS/FAILED while this flag
  // remains true; QueryState and the RPC status show the actual result.
  return (
    <>
      <Note>
        This hook only observes an existing hash. Starting or stopping the poll
        never resubmits the transaction.
      </Note>
      <Field
        label="Transaction hash"
        value={input}
        disabled={watching}
        onChange={(event) => setInput(event.target.value.trim())}
      />
      <Actions>
        <button
          type="button"
          disabled={!hash || watching}
          onClick={() => setWatching(true)}
        >
          Start waiting
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!watching}
          onClick={() => setWatching(false)}
        >
          Stop waiting
        </button>
      </Actions>
      <Value label="Observation enabled">{String(watching)}</Value>
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
