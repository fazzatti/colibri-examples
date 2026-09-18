/**
 * Show a small, retained trace beside the authentication example controls.
 * Entries come from real HTTP boundaries and observed session transitions.
 * Fast steps remain readable after completion; only an active request spins.
 * This component renders already-redacted labels and never receives secrets.
 *
 * @module
 */
import type { AuthActivityEntry } from "../setup/auth-activity.ts";
import { Spinner } from "./lesson.tsx";

export function AuthActivity({ entries, busy, clear }: {
  entries: AuthActivityEntry[];
  busy: boolean;
  clear(): void;
}) {
  return (
    <section className="auth-activity" aria-label="Authentication activity">
      <div className="activity-heading">
        <h3>Activity</h3>
        <button
          type="button"
          className="secondary small"
          disabled={busy || !entries.length}
          onClick={clear}
        >
          Clear activity
        </button>
      </div>
      <p className="muted" role="status">
        {busy && <Spinner />}
        {busy ? "Waiting for the local service…" : "No request in progress."}
        {" "}
        The last 20 events stay here. Request bodies and tokens are omitted.
      </p>
      {entries.at(-1)?.kind === "error" && (
        <p className="muted">
          Local service unavailable? From <code>examples/web</code>, restart
          {" "}
          <code>deno task dev</code> or <code>deno task preview</code>, or run
          {" "}
          <code>deno task auth</code>{" "}
          separately. Check its terminal for errors, then refresh discovery.
          After a server restart or challenge-validation error, refresh
          discovery before authenticating again.
        </p>
      )}
      <ol
        role="log"
        aria-label="WebAuth activity log"
        aria-live="polite"
        aria-relevant="additions"
        className="activity-log"
      >
        {entries.map((entry) => (
          <li key={entry.id} data-kind={entry.kind}>
            <time dateTime={new Date(entry.time).toISOString()}>
              {new Date(entry.time).toLocaleTimeString()}
            </time>
            <span>{entry.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
