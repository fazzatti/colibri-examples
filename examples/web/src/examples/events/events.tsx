import { useMemo, useState } from "react";
import { EventFilter } from "@colibri/core/events";
import { useColibriConfig } from "@colibri/react";
import { createContractEvents, useContractEvents } from "@colibri/react/events";
import { contractId, exampleCounter } from "../../setup/fixtures.ts";
import {
  Actions,
  Data,
  Failure,
  Note,
  Value,
} from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Stream({ id }: { id: `C${string}` }) {
  const config = useColibriConfig();

  // One stable store owns a bounded event window. The hook starts it with the
  // first observer and stops it when this component unmounts. Construction
  // does not start network work, including React Strict Mode's render probe.
  const subscription = useMemo(() =>
    createContractEvents(config, {
      filters: [new EventFilter({ contractIds: [id] })],
      maxEvents: 25,
    }), [config, id]);
  const state = useContractEvents(subscription);
  return (
    <>
      <Value label="Stream status">
        {state.status} · {state.events.length} / 25 retained
      </Value>
      <Failure error={state.error} />
      <Actions>
        <button
          type="button"
          className="secondary"
          onClick={() => subscription.restart()}
        >
          Restart stream
        </button>
      </Actions>
      {state.events.map((event) => (
        <Data
          key={String(event.id)}
          label={`Ledger ${event.ledger} · ${event.txHash.slice(0, 8)}…`}
          value={{
            id: String(event.id),
            ledger: event.ledger,
            topics: event.topics,
            value: event.value,
            hash: event.txHash,
          }}
        />
      ))}
    </>
  );
}
export default function Events() {
  const id = contractId(exampleCounter);
  const [running, setRunning] = useState(true);
  if (!id) return <FixtureRequired />;
  return (
    <>
      <Note>
        The stream starts at the latest ledger. Keep this page open and invoke
        the counter from another tab to see CountChanged events. Stop or
        navigate away to release the observer. RPC retention bounds history.
      </Note>
      <Actions>
        <button
          type="button"
          className="secondary"
          onClick={() => setRunning(!running)}
        >
          {running ? "Stop observing" : "Start observing"}
        </button>
        <a href="#wallet-invoke" target="_blank" rel="noreferrer">
          Open invocation in another tab ↗
        </a>
      </Actions>
      {running ? <Stream id={id} /> : (
        <p role="status">
          Observer stopped. Starting again begins a new live window.
        </p>
      )}
    </>
  );
}
