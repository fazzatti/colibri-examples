import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { isKeypairSigner, type KeypairSigner } from "@colibri/core";
import {
  createColibriConfig,
  useColibriConfig,
  useConnection,
} from "@colibri/react";
import { ColibriQueryProvider } from "@colibri/react/provider";
import { useIsMutating } from "@tanstack/react-query";
import { Actions, Failure, Value } from "../components/lesson.tsx";
import { createPracticeIdentity } from "./practice-identity.ts";
import { accountId } from "./fixtures.ts";
import { network } from "./network.ts";

type Source = "none" | "local" | "wallet";
type Capability = "transaction" | "message" | "keypair";
const SignerContext = createContext<
  { source: Source; getKeypairSigner(): KeypairSigner } | null
>(null);

// Capture the app's provider BEFORE nesting the selected lesson provider.
// Wallet mode uses the original config, so its identity-change guards remain
// active. Local mode owns a separate config/key and never replaces the wallet.
export function SignerProvider(
  { children, capability = "transaction" }: PropsWithChildren<
    { capability?: Capability }
  >,
) {
  const appConfig = useColibriConfig();
  const wallet = useConnection();
  const [identity] = useState(createPracticeIdentity);
  const [localConfig] = useState(() =>
    createColibriConfig({ network, connectors: [identity.connector] })
  );
  const local = useSyncExternalStore(
    localConfig.subscribe,
    localConfig.getSnapshot,
    localConfig.getServerSnapshot,
  );
  const [source, setSource] = useState<Source>("none");
  const [generation, setGeneration] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<unknown>();
  const mounted = useRef(false);
  const connection = wallet.connection;
  const keypair = connection?.signers.find((signer): signer is KeypairSigner =>
    isKeypairSigner(signer) && signer.publicKey() === connection.address
  );
  const available = capability === "message"
    ? !!connection?.messageSigner
    : capability === "keypair"
    ? !!keypair
    : !!connection?.signers.some((signer) => "signTransaction" in signer);
  const walletReady = wallet.status === "connected" &&
    !!accountId(connection?.address ?? "") && available;
  const selected = source === "wallet" ? connection : local.connection;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Preserve the same handle during Strict Mode effect replay. Actual
      // unmount releases ONLY lesson-owned authority, never the outer wallet.
      queueMicrotask(() => {
        if (mounted.current) return;
        localConfig.destroy();
        identity.destroy();
      });
    };
  }, [localConfig, identity]);

  async function choose(next: "local" | "wallet") {
    setSelecting(true);
    setError(undefined);
    try {
      if (next === "local") await localConfig.connect("practice-identity");
      else {
        if (!walletReady) return;
        await localConfig.disconnect();
      }
      if (!mounted.current) return;
      setSource(next);
      setGeneration((value) => value + 1);
    } catch (cause) {
      setError(cause);
    } finally {
      setSelecting(false);
    }
  }

  function getKeypairSigner() {
    if (source === "local") return identity.getSigner();
    if (source === "wallet" && keypair) return keypair;
    throw new Error(
      "Choose a signer with the synchronous keypair capability required by SEP-10.",
    );
  }

  return (
    <SignerContext.Provider value={{ source, getKeypairSigner }}>
      {
        /* A choice/account change clears the previous lesson's forms, receipts
          and session. The wallet configuration itself is never recreated. */
      }
      <ColibriQueryProvider
        key={`${source}:${generation}:${
          source === "wallet" ? connection?.address ?? "disconnected" : "local"
        }`}
        config={source === "wallet" ? appConfig : localConfig}
      >
        <ChoiceControls
          selecting={selecting}
          walletReady={walletReady}
          source={source}
          choose={choose}
        />
        <p className="muted">
          Local keys belong only to this example and are destroyed when you
          switch to the wallet or leave. The connected wallet stays in the
          header.
        </p>
        {!walletReady && (
          <p className="muted">
            {capability === "keypair"
              ? "SEP-10 currently needs synchronous raw-key signing in Colibri WebAuth. Wallets Kit and direct Freighter cannot supply that capability; use a local signer here."
              : !connection
              ? "Connect a wallet in the header to enable the wallet option."
              : capability === "message"
              ? "This connection has no SEP-53 message signer. Use Wallets Kit with Freighter, or create a local signer."
              : "This example needs a G-account with transaction-envelope signing support."}
          </p>
        )}
        <Value label="Selected signer">
          {source === "none"
            ? "Choose a signer above"
            : `${source === "local" ? "Local" : "Wallet"}: ${
              selected?.address ??
                "Disconnected — reconnect or choose a local signer"
            }`}
        </Value>
        <Failure error={error} />
        {children}
      </ColibriQueryProvider>
    </SignerContext.Provider>
  );
}

function ChoiceControls({ selecting, walletReady, source, choose }: {
  selecting: boolean;
  walletReady: boolean;
  source: Source;
  choose(source: "local" | "wallet"): Promise<void>;
}) {
  // Keep a signing request and its source together until it settles.
  const pending = useIsMutating() > 0;
  return (
    <fieldset className="lesson-step">
      <legend>Choose a signer</legend>
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={selecting || pending}
          onClick={() => void choose("local")}
        >
          {source === "local"
            ? "Create a new local signer"
            : "Create local signer"}
        </button>
        <button
          type="button"
          className="secondary"
          aria-pressed={source === "wallet"}
          disabled={!walletReady || selecting || pending || source === "wallet"}
          onClick={() => void choose("wallet")}
        >
          Use connected wallet
        </button>
      </Actions>
    </fieldset>
  );
}

export function useLessonSigner() {
  const signer = useContext(SignerContext);
  if (!signer) throw new Error("The example needs its signer provider.");
  return signer;
}
