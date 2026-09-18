/**
 * Let each signing lesson choose a local identity or the connected app wallet.
 *
 * This is setup shared by the examples, not a replacement for their Colibri
 * hooks. Capture the outer configuration first, create a separate local one,
 * then nest a provider containing the selected source and its own query cache.
 * Children continue to call useWallet/useSigners/useSignMessage directly.
 * Capability checks explain unavailable wallet choices; they never silently
 * substitute a local key. Source changes remount children to clear old forms,
 * receipts and sessions. Cleanup releases only resources this lesson owns.
 *
 * @module
 */
import {
  type PropsWithChildren,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { isEnvelopeSigner } from "@colibri/core";
import {
  createColibriConfig,
  useColibriConfig,
  useConnection,
} from "@colibri/react";
import { ColibriQueryProvider } from "@colibri/react/provider";
import { useIsMutating } from "@tanstack/react-query";
import { Actions, Failure, Spinner, Value } from "../components/lesson.tsx";
import { createPracticeIdentity } from "./practice-identity.ts";
import { accountId } from "./fixtures.ts";
import { network } from "./network.ts";

type Source = "none" | "local" | "wallet";
type Capability = "transaction" | "message" | "authentication";

// Capture the app's provider BEFORE nesting the selected lesson provider.
// Wallet mode uses the original config, so its identity-change guards remain
// active. Local mode owns a separate config/key and never replaces the wallet.
export function SignerProvider(
  { children, capability = "transaction" }: PropsWithChildren<
    { capability?: Capability }
  >,
) {
  const appConfig = useColibriConfig();
  // Subscribe to the HEADER wallet, even while this lesson uses its local key.
  // Derive button availability on every snapshot: copying connection state into
  // useState would miss a wallet connected after the lesson has mounted.
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

  // SEP-10 accepts an Ed25519 envelope signer, including asynchronous wallets.
  // Message signing remains a separate capability. The WebAuth engine verifies
  // the returned challenge and signature; no raw private-key handle is needed.
  const address = accountId(connection?.address ?? "");
  const available = capability === "message"
    ? !!connection?.messageSigner
    : !!connection?.signers.some((signer) =>
      isEnvelopeSigner(signer) &&
      (capability !== "authentication" ||
        (!!accountId(signer.signerKey()) && !!address &&
          signer.signsFor(address)))
    );
  const walletReady = wallet.status === "connected" &&
    !!accountId(connection?.address ?? "") && available;
  const selected = source === "wallet" ? connection : local.connection;

  function describeWallet() {
    if (wallet.status === "connecting") {
      return "Connecting the header wallet. Complete the wallet prompt to check its signing capabilities.";
    }
    if (wallet.status !== "connected") {
      return "No wallet connected. Connect in the header to check whether it supports this step.";
    }
    if (!accountId(connection?.address ?? "")) {
      return "Wallet connected, but this step requires a Stellar G-account. Choose a G-account or create a local signer.";
    }
    if (walletReady) {
      return source === "wallet"
        ? "Using the header wallet. Account changes and disconnection are reflected here automatically."
        : "Wallet connected and compatible with this step. Select it to use its signer; connecting alone does not change your chosen signer.";
    }
    if (capability === "authentication") {
      return "Wallet connected, but SEP-10 needs an Ed25519 transaction-envelope signer for this account. Use Wallets Kit with Freighter, direct Freighter, or a local signer.";
    }
    if (capability === "message") {
      return "Wallet connected, but this connection has no SEP-53 message signer. Use Wallets Kit with Freighter, or create a local signer.";
    }
    return "Wallet connected, but this connection has no transaction-envelope signer. Use a wallet with that capability, or create a local signer.";
  }

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
      // Generating a key is an explicit action. Switching to the wallet first
      // releases the local connection/key; neither branch reconnects or replaces
      // the outer wallet. generation below forces a fresh lesson after each choice.
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

  return (
    <>
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
          walletStatus={wallet.status}
          walletDescription={describeWallet()}
          source={source}
          choose={choose}
        />
        <p className="muted">
          Local keys belong only to this example and are destroyed when you
          switch to the wallet or leave. The connected wallet stays in the
          header.
        </p>
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
    </>
  );
}

function ChoiceControls({
  selecting,
  walletReady,
  walletStatus,
  walletDescription,
  source,
  choose,
}: {
  selecting: boolean;
  walletReady: boolean;
  walletStatus: ReturnType<typeof useConnection>["status"];
  walletDescription: string;
  source: Source;
  choose(source: "local" | "wallet"): Promise<void>;
}) {
  // Keep a signing request and its source together until it settles.
  const pending = useIsMutating() > 0;
  const walletDescriptionId = useId();
  const walletSelected = source === "wallet" && walletReady;

  // A connected wallet can be incompatible with a particular lesson. Show that
  // state explicitly instead of leaving the same unexplained disabled button.
  // Keep the reason beside the control and announce connection changes.
  const walletLabel = walletStatus === "connecting"
    ? "Connecting wallet…"
    : walletStatus === "connected" && !walletReady
    ? "Wallet unavailable for this step"
    : walletSelected
    ? "Using connected wallet"
    : "Use connected wallet";
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
          aria-pressed={walletSelected}
          aria-describedby={walletDescriptionId}
          disabled={!walletReady || selecting || pending || source === "wallet"}
          onClick={() => void choose("wallet")}
        >
          {walletStatus === "connecting" && <Spinner />}
          {walletLabel}
        </button>
      </Actions>
      <p id={walletDescriptionId} className="muted" role="status">
        {walletDescription}
        {(selecting || pending) &&
          " Signer choices are locked until the current operation finishes."}
      </p>
    </fieldset>
  );
}
