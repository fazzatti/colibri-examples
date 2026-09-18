/**
 * Authenticate with SEP-10 and observe an in-memory WebAuth session.
 *
 * Run deno task auth from examples/web, choose a compatible signer on this page,
 * and authenticate. SessionExample discovers its own client and owns the session;
 * Authentication uses useWebAuth for the exchange and useSession for its state.
 * Only account/expiry metadata is displayed. Try local logout and disconnect,
 * then leave the page to exercise cleanup. SEP-10 signs a challenge without
 * submitting a ledger transaction. The current client needs a synchronous full
 * keypair signer, so the Kit and direct Freighter adapters cannot be selected.
 *
 * @module
 */
import { useEffect, useState } from "react";
import { useColibriConfig, useConnection, useDisconnect } from "@colibri/react";
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
import {
  SignerProvider,
  useLessonSigner,
} from "../../setup/signer-provider.tsx";
import {
  Actions,
  Failure,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";

function Authentication({ session }: { session: WebAuthSession }) {
  const identity = useLessonSigner();
  const disconnect = useDisconnect();
  const connection = useConnection();

  // Observe the session store separately from the authentication mutation.
  // useWebAuth performs the exchange but does not put the JWT in its mutation
  // result; useSession exposes the session's status and token metadata.
  const state = useSession(session);
  const authentication = useWebAuth(session);
  const [error, setError] = useState<unknown>();

  function authenticate() {
    setError(undefined);
    try {
      // SEP-10 verifies the server challenge before signing and exchanging it.
      // This API currently requires a complete keypair signer; the Kit's
      // envelope capability alone is insufficient. No transaction is submitted.
      const signer = identity.getKeypairSigner();
      authentication.mutate({ account: signer.publicKey(), signer });
    } catch (cause) {
      setError(cause);
    }
  }
  async function release() {
    setError(undefined);
    try {
      // Disconnect the selected provider's identity, which also invalidates
      // its session. The separate logout button clears only this local session;
      // using a local signer does not disconnect the header's external wallet.
      await disconnect();
    } catch (cause) {
      setError(cause);
    }
  }

  // Render only account and expiry, never the token string. Session data must
  // not be sent to the generic Data diagnostic component or browser persistence.
  return (
    <>
      <Actions>
        <button
          type="button"
          disabled={connection.status !== "connected" ||
            authentication.isPending}
          onClick={authenticate}
        >
          Authenticate with SEP-10
        </button>
      </Actions>
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
function SessionExample() {
  const config = useColibriConfig();

  // Preserve the browser fetch receiver when the WebAuth transport invokes it.
  // This lesson discovers its own client; no earlier discovery step is needed.
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
        from examples/web in another terminal. Choose a signer above, then
        authenticate. The local server verifies the signed challenge and issues
        a short-lived token. Your connected wallet is separate from this session
        when using a local signer.
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

// Require the complete synchronous keypair capability used by this WebAuth
// client. A wallet's async envelope signer is a different interface; the
// selector explains that limitation instead of silently changing authority.
export default function Session() {
  return (
    <SignerProvider capability="keypair">
      <SessionExample />
    </SignerProvider>
  );
}
