import { useEffect, useState } from "react";
import {
  useColibriConfig,
  useConnect,
  useConnection,
  useDisconnect,
} from "@colibri/react";
import {
  createWebAuthSession,
  type WebAuthSession,
} from "@colibri/react/session";
import {
  useSession,
  useWebAuth,
  useWebAuthClient,
} from "@colibri/react/webauth";
import { authDomain } from "../../setup/fixtures.ts";
import { getPracticeSigner } from "../../setup/practice-identity.ts";
import {
  Actions,
  Failure,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

function Authentication({ session }: { session: WebAuthSession }) {
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connection = useConnection();
  const state = useSession(session);
  const authentication = useWebAuth(session);
  const [error, setError] = useState<unknown>();

  async function createIdentity() {
    setError(undefined);
    authentication.reset();
    try {
      await connect("practice-identity");
    } catch (cause) {
      setError(cause);
    }
  }
  function authenticate() {
    setError(undefined);
    try {
      // SEP-10 verifies the server challenge before signing and exchanging it.
      // This API currently requires a complete keypair signer; the Kit's
      // envelope capability alone is insufficient. No transaction is submitted.
      const signer = getPracticeSigner();
      authentication.mutate({ account: signer.publicKey(), signer });
    } catch (cause) {
      setError(cause);
    }
  }
  async function release() {
    setError(undefined);
    try {
      await disconnect();
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={authentication.isPending ||
            connection.status === "connecting"}
          onClick={() => void createIdentity()}
        >
          Create practice identity
        </button>
        <button
          type="button"
          disabled={connection.connectorId !== "practice-identity" ||
            connection.status !== "connected" || authentication.isPending}
          onClick={authenticate}
        >
          Authenticate with SEP-10
        </button>
      </Actions>
      <Value label="Practice identity">
        {connection.connectorId === "practice-identity"
          ? connection.connection?.address ?? "—"
          : "Create a practice identity above"}
      </Value>
      <Failure error={error ?? authentication.error} />
      <div className="result" aria-live="polite">
        <Value label="Session">{state.status}</Value>
        {state.token && (
          <>
            <Value label="Authenticated account">{state.token.account}</Value>
            <Value label="Expires at">
              {state.token.expiresAt?.toLocaleTimeString()}
            </Value>
          </>
        )}
      </div>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={state.status === "anonymous"}
          onClick={() => session.logout()}
        >
          Log out locally
        </button>
        <button
          type="button"
          className="secondary"
          disabled={connection.status === "disconnected"}
          onClick={() => void release()}
        >
          Disconnect identity
        </button>
      </Actions>
      <p className="muted">
        Only account and expiry are displayed. JWTs stay in the session, outside
        the query cache and browser storage. Logout is local; disconnect,
        identity change, expiry and leaving this lesson also clear this session.
      </p>
    </>
  );
}
export default function Session() {
  const config = useColibriConfig();
  // Preserve the browser fetch receiver when the WebAuth transport invokes it.
  // Match the discovery lesson's scope so both share this configured client.
  const client = useWebAuthClient(
    authDomain,
    {
      allowHttp: true,
      fetch: (input, init) => globalThis.fetch(input, init),
    },
    { retry: false },
    "loopback-browser",
  );
  const [session, setSession] = useState<WebAuthSession>();

  // Session construction subscribes to the provider. Own it in an effect,
  // including cleanup/recreation during Strict Mode's development probe.
  useEffect(() => {
    if (!client.data) return;
    const owned = createWebAuthSession(config, client.data);
    setSession(owned);
    return () => {
      owned.destroy();
    };
  }, [config, client.data]);

  return (
    <>
      <Note>
        Run <code>deno task auth</code>{" "}
        in another terminal. Create an unfunded practice identity, then
        authenticate. The local server verifies the signed challenge and issues
        a short-lived token; this is a real exchange, not a simulated success.
      </Note>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={client.isFetching}
          onClick={() => void client.refetch()}
        >
          Refresh discovery
        </button>
      </Actions>
      <QueryState query={client} />
      {session && <Authentication session={session} />}
    </>
  );
}
