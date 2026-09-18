/**
 * Authenticate with SEP-10 and observe an in-memory WebAuth session.
 *
 * Start deno task dev or preview from examples/web, choose a compatible signer,
 * and authenticate. SessionExample discovers its own client and owns the session;
 * Authentication uses useWebAuth for the exchange and useSession for its state.
 * Only account/expiry metadata is displayed. Try local logout and disconnect,
 * then leave the page to exercise cleanup. SEP-10 signs a challenge without
 * submitting a ledger transaction. The current client needs a synchronous full
 * keypair signer, so the Kit and direct Freighter adapters cannot be selected.
 *
 * @module
 */
import { useEffect, useRef, useState } from "react";
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
import { AuthActivity } from "../../components/auth-activity.tsx";
import { useAuthActivity } from "../../setup/auth-activity.ts";
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

function Authentication({ session, record }: {
  session: WebAuthSession;
  record: ReturnType<typeof useAuthActivity>["record"];
}) {
  const identity = useLessonSigner();
  const disconnect = useDisconnect();
  const connection = useConnection();

  // Observe the session store separately from the authentication mutation.
  // useWebAuth performs the exchange but does not put the JWT in its mutation
  // result; useSession exposes the session's status and token metadata.
  const state = useSession(session);
  const authentication = useWebAuth(session, {
    onError: () =>
      record(
        "Authentication failed. See the error above; no automatic retry was made.",
        "error",
      ),
  });
  const previousStatus = useRef(state.status);

  // These are observed session transitions, not simulated progress timers.
  // The transport separately records GET challenge and POST signed challenge;
  // an authenticated state means Colibri accepted the returned token context.
  useEffect(() => {
    if (state.status === previousStatus.current) return;
    if (state.status === "authenticating") record("Session: authenticating.");
    if (state.status === "authenticated") {
      record(
        "Session authenticated. Token retained in memory; no ledger transaction submitted.",
        "success",
      );
    }
    if (state.status === "anonymous") {
      record(
        previousStatus.current === "authenticating"
          ? "Session returned to anonymous; authentication did not complete."
          : "Session cleared (logout, disconnect, identity change or expiry).",
      );
    }
    previousStatus.current = state.status;
  }, [state.status, record]);
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
      record(
        "Cannot begin authentication: select a compatible signer first.",
        "error",
      );
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
  const activity = useAuthActivity();
  const { record } = activity;

  // Preserve the browser fetch receiver when the WebAuth transport invokes it.
  // This lesson discovers its own client; no earlier discovery step is needed.
  const client = useWebAuthClient(
    authDomain,
    {
      allowHttp: true,
      fetch: activity.fetch,
      timeout: 10_000,
    },
    { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
    activity.scope,
  );
  useEffect(() => {
    // Cached data can remain available during a refetch; announce the outcome
    // only once the current request has settled.
    if (client.isFetching) return;
    if (client.isSuccess) {
      record(
        "Discovery validated. SEP-10 client ready for this lesson.",
        "success",
      );
    }
    if (client.isError) {
      record(
        "Discovery failed. Check the local service and the error above, then refresh discovery.",
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
        Dev and preview start the local auth fixture automatically. Choose a
        signer above, then authenticate. Activity shows discovery, the challenge
        request, signed-challenge exchange and session changes. The local server
        verifies the challenge and returns a short-lived token. Your header
        wallet stays separate when using a local signer.
      </Note>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={client.isFetching || activity.busy}
          onClick={() => void client.refetch()}
        >
          Refresh discovery
        </button>
      </Actions>
      <QueryState query={client} />
      {session && client.isSuccess && !client.isFetching && (
        <Authentication session={session} record={record} />
      )}
      <AuthActivity {...activity} />
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
