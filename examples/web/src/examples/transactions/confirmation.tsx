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
  const [watching, setWatching] = useState(false);
  const hash = /^[a-fA-F0-9]{64}$/.test(input) ? input : undefined;

  // Polling stops at SUCCESS/FAILED. A hash can stay NOT_FOUND indefinitely,
  // so the user can also stop observation or leave this lesson.
  const transaction = useWaitForTransaction(hash, { enabled: watching });
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
