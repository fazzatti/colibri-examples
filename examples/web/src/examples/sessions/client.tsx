import { useState } from "react";
import { useWebAuthClient } from "@colibri/react/webauth";
import { authDomain } from "../../setup/fixtures.ts";
import { Actions, Note, QueryState, Value } from "../../components/lesson.tsx";

export default function AuthClient() {
  const [enabled, setEnabled] = useState(false);

  // The hook discovers SEP-10/45 configuration through the domain's SEP-1 file.
  // Discovering a client does not sign a challenge or create a session.
  // WebAuth 1.1.0 stores the fetch callback as a method. The forwarding
  // function preserves Window's receiver in browsers (native fetch needs it).
  const client = useWebAuthClient(
    enabled ? authDomain : undefined,
    {
      allowHttp: true,
      fetch: (input, init) => globalThis.fetch(input, init),
    },
    {},
    "loopback-browser",
  );
  return (
    <>
      <Note>
        Run <code>deno task auth</code>{" "}
        first. This loopback fixture advertises a real SEP-10 endpoint using the
        Testnet network passphrase. HTTP is allowed only for this local example.
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
    </>
  );
}
