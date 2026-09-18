/**
 * Discover a domain's SEP-1 service declarations with useStellarToml.
 *
 * Start deno task dev or preview from examples/web, then click Discover.
 * Both start the local auth fixture automatically.
 * The fixture serves /.well-known/stellar.toml at the fixed loopback domain.
 * Follow the disabled initial query into its first request and later refetches,
 * then compare the parsed network passphrase with the raw document. Discovery
 * only reads advertised configuration; it neither authenticates an account nor
 * calls the advertised service. HTTP is allowed for this local fixture only.
 *
 * @module
 */
import { useEffect, useState } from "react";
import { useStellarToml } from "@colibri/react/sep1";
import { AuthActivity } from "../../components/auth-activity.tsx";
import { useAuthActivity } from "../../setup/auth-activity.ts";
import { authDomain } from "../../setup/fixtures.ts";
import {
  Actions,
  Data,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

export default function Toml() {
  // The first click enables discovery; subsequent clicks refetch the same
  // domain, for example after restarting the local fixture. Keep background
  // refetch/retries off so each request corresponds to a visible user action.
  const activity = useAuthActivity();
  const { record } = activity;
  const [enabled, setEnabled] = useState(false);

  // The optional local service advertises Testnet in its stellar.toml.
  // HTTP is permitted here only for this fixed loopback development domain.
  const discovery = useStellarToml(
    enabled ? authDomain : undefined,
    {
      allowHttp: true,
      fetchFn: activity.fetch,
      timeout: 10_000,
    },
    { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
    activity.scope,
  );

  // HTTP success is separate from parsing/validation: log a usable document
  // only once the hook has accepted it, not merely after receiving HTTP 200.
  useEffect(() => {
    // Cached data can remain available during a refetch; announce the outcome
    // only once the current request has settled.
    if (discovery.isFetching) return;
    if (discovery.isSuccess) {
      record("SEP-1 document parsed and validated.", "success");
    }
    if (discovery.isError) {
      record(
        "SEP-1 discovery failed. Check the local service and the error above, then retry.",
        "error",
      );
    }
  }, [
    discovery.isFetching,
    discovery.isSuccess,
    discovery.isError,
    discovery.dataUpdatedAt,
    discovery.errorUpdatedAt,
    record,
  ]);
  return (
    <>
      <Note>
        Dev and preview start this local fixture automatically. SEP-1 discovers
        service configuration; it does not implement the advertised services.
        Activity below records the request and document validation.
      </Note>
      <Value label="Discovery URL">
        http://{authDomain}/.well-known/stellar.toml
      </Value>
      <Actions>
        <button
          type="button"
          disabled={discovery.isFetching}
          onClick={() => {
            if (enabled) void discovery.refetch();
            else setEnabled(true);
          }}
        >
          Discover local stellar.toml
        </button>
      </Actions>
      <QueryState query={discovery}>
        {discovery.data && (
          <>
            <Value label="Advertised network">
              {discovery.data.networkPassphrase}
            </Value>
            <Data value={discovery.data.raw} />
          </>
        )}
      </QueryState>
      <AuthActivity {...activity} />
    </>
  );
}
