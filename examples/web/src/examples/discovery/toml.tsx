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
        <code>deno task web:auth</code>. SEP-1 discovers service configuration;
        it does not implement the advertised services.
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
