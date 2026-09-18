/**
 * Authenticate with SEP-10 and observe an in-memory WebAuth session.
 *
 * Start deno task dev or preview from examples/web, choose a compatible signer,
 * and authenticate. SessionExample discovers its own client and owns the session;
 * Authentication uses useWebAuth for the exchange and useSession for its state.
 * Only account/expiry metadata is displayed. Try local logout and disconnect,
 * then leave the page to exercise cleanup. SEP-10 signs a challenge without
 * submitting a ledger transaction. Both local and connected-wallet envelope
 * signers use the same asynchronous WebAuth API; wallet approval may take time.
 *
 * @module
 */
import { useEffect, useRef, useState } from "react";
import { type EnvelopeSigner, isEnvelopeSigner } from "@colibri/core";
import { useSigners } from "@colibri/react/signers";
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
import { accountId, authDomain } from "../../setup/fixtures.ts";
import { SignerProvider } from "../../setup/signer-provider.tsx";
import {
  Actions,
  Failure,
  Note,
  QueryState,
  Spinner,
  Value,
} from "../../components/lesson.tsx";

function Authentication({ session, record }: {
  session: WebAuthSession;
  record: ReturnType<typeof useAuthActivity>["record"];
}) {
  const disconnect = useDisconnect();
  const connection = useConnection();

  // Read the selected provider's guarded envelope capability. A local key and
  // an extension wallet both implement it; connection guards reject stale
  // authority if the wallet changes while its approval prompt is open.
  const signers = useSigners();
  const account = accountId(connection.connection?.address ?? "");
  const signer = signers.find((candidate): candidate is EnvelopeSigner =>
    isEnvelopeSigner(candidate) && !!accountId(candidate.signerKey()) &&
    !!account && candidate.signsFor(account)
  );

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
    if (!account || !signer) return;

    // WebAuth calls this only after validating the server challenge. Forward to
    // the guarded signer and log real approval boundaries without exposing XDR
    // or signatures. The SDK then validates the returned signed envelope before
    // POSTing it to the auth service; it never submits it to the ledger.
    const recordedSigner: EnvelopeSigner = {
      signerKey: () => signer.signerKey(),
      signsFor: (target) => signer.signsFor(target),
      signTransaction: async (transaction) => {
        record(
          "Challenge validated. Waiting for the selected signer; approve the request if using a wallet.",
        );
        const signed = await signer.signTransaction(transaction);
        record(
          "Signer returned an envelope. WebAuth will validate it before exchange.",
        );
        return signed;
      },
    };
    authentication.mutate({ account, signer: recordedSigner });
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
          disabled={!account || !signer || authentication.isPending}
          onClick={authenticate}
        >
          {authentication.isPending && <Spinner />}
          {authentication.isPending
            ? "Authenticating…"
            : "Authenticate with SEP-10"}
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
        local signer or the connected wallet above, then authenticate. Approve
        the wallet request when prompted. Activity shows discovery, challenge
        validation, the wait for signing, exchange and session changes. The
        local server verifies the challenge and returns a short-lived token.
        Your header wallet stays separate when using a local signer.
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

// Both sources use an Ed25519 envelope signer. This selector enables wallets
// connected after mount and keeps local keys independent of the header wallet.
export default function Session() {
  return (
    <SignerProvider capability="authentication">
      <SessionExample />
    </SignerProvider>
  );
}
