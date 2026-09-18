/**
 * Discover a domain's SEP-1 service declarations with useStellarToml.
 *
 * Run deno task auth from examples/web in another terminal, then click Discover.
 * The fixture serves /.well-known/stellar.toml at the fixed loopback domain.
 * Follow the disabled initial query into its first request and later refetches,
 * then compare the parsed network passphrase with the raw document. Discovery
 * only reads advertised configuration; it neither authenticates an account nor
 * calls the advertised service. HTTP is allowed for this local fixture only.
 *
 * @module
 */
import { useState } from "react";
import { useStellarToml } from "@colibri/react/sep1";
import { authDomain } from "../../setup/fixtures.ts";
import {
  Actions,
  Data,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

export default function Toml() {
  // Wait for an explicit click because the optional local server may not be
  // running. The first click enables discovery; subsequent clicks refetch the
  // same domain, for example after restarting its server.
  const [enabled, setEnabled] = useState(false);

  // The optional local service advertises Testnet in its stellar.toml.
  // HTTP is permitted here only for this fixed loopback development domain.
  const discovery = useStellarToml(enabled ? authDomain : undefined, {
    allowHttp: true,
  });
  return (
    <>
      <Note>
        In another terminal, run{" "}
        <code>deno task auth</code>. SEP-1 discovers service configuration; it
        does not implement the advertised services.
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
    </>
  );
}
