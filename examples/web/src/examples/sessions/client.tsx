/**
 * Discover a Colibri WebAuth client before performing authentication.
 *
 * Start deno task dev or preview from examples/web and click Discover.
 * Both start the local auth fixture automatically.
 * useWebAuthClient reads SEP-1 authentication configuration for the fixed local
 * domain and returns a protocol client. Inspect its home domain and network;
 * no challenge is signed and no session/token is created here. session.tsx
 * performs its own discovery, so this lesson is an optional explanation rather
 * than a prerequisite. The forwarding fetch callback is needed by this version
 * of WebAuth when used with native browser fetch. The activity panel observes
 * actual HTTP requests; successful discovery is logged only after validation.
 *
 * @module
 */
import { useEffect, useState } from "react";
import { useWebAuthClient } from "@colibri/react/webauth";
import { AuthActivity } from "../../components/auth-activity.tsx";
import { useAuthActivity } from "../../setup/auth-activity.ts";
import { authDomain } from "../../setup/fixtures.ts";
import { Actions, Note, QueryState, Value } from "../../components/lesson.tsx";

export default function AuthClient() {
  const activity = useAuthActivity();
  const { record } = activity;
  const [enabled, setEnabled] = useState(false);

  // The hook discovers SEP-10/45 configuration through the domain's SEP-1 file.
  // Discovering a client does not sign a challenge or create a session.
  // WebAuth stores the fetch callback as a method. The forwarding
  // activity transport preserves Window's receiver and records request/status
  // labels only. It never consumes response bodies or logs credentials.
  const client = useWebAuthClient(
    enabled ? authDomain : undefined,
    {
      allowHttp: true,
      fetch: activity.fetch,
      timeout: 10_000,
    },
    { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
    // A client holds its fetch callback. Scope it to this mounted observer so
    // another lesson cannot inherit a cached client pointing at this log.
    activity.scope,
  );

  useEffect(() => {
    // Cached data can remain available during a refetch; announce the outcome
    // only once the current request has settled.
    if (client.isFetching) return;
    if (client.isSuccess) {
      record("Discovery validated. Testnet WebAuth client ready.", "success");
    }
    if (client.isError) {
      record(
        "Discovery failed. Check the local service and the error above, then retry.",
        "error",
      );
    }
  }, [
    client.isFetching,
    client.isSuccess,
    client.isError,
    client.dataUpdatedAt,
    client.errorUpdatedAt,
    record,
  ]);

  // Display the discovered domain/network instead of serializing the client.
  // The first click enables its query; later clicks refresh discovery after a
  // local server restart. Navigating onward does not transfer an auth session.
  return (
    <>
      <Note>
        <code>deno task dev</code> and <code>deno task preview</code>{" "}
        start the local Testnet SEP-10 fixture automatically. Discovery reads
        its stellar.toml; it does not sign in. Activity below shows the request
        and validated result. HTTP is allowed only for this loopback example.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={client.isFetching}
          onClick={() => {
            if (enabled) void client.refetch();
            else setEnabled(true);
          }}
        >
          Discover WebAuth client
        </button>
      </Actions>
      <QueryState query={client}>
        {client.data && (
          <>
            <Value label="Home domain">{client.data.homeDomain}</Value>
            <Value label="Network">
              {client.data.network.networkPassphrase}
            </Value>
            <a href="#session">Continue to authentication →</a>
          </>
        )}
      </QueryState>
      <AuthActivity {...activity} />
    </>
  );
}
