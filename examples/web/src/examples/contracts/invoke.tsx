import { useState } from "react";
import { initializeWithFriendbot } from "@colibri/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  useColibriConfig,
  useConnect,
  useConnection,
  useNetwork,
} from "@colibri/react";
import { useSigners } from "@colibri/react/signers";
import { useContract } from "@colibri/react/contracts";
import {
  contractReadQueryOptions,
  useContractRead,
} from "@colibri/react/contracts/read";
import { useContractInvoke } from "@colibri/react/contracts/invoke";
import { Counter } from "../../generated/counter/index.ts";
import { accountId, contractId, exampleCounter } from "../../setup/fixtures.ts";
import { PracticeProvider } from "../../setup/practice-provider.tsx";
import {
  Actions,
  Failure,
  MutationState,
  Note,
  QueryState,
  Spinner,
  Value,
} from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Invoke({ id }: { id: `C${string}` }) {
  const network = useNetwork();
  const config = useColibriConfig();
  const queryClient = useQueryClient();
  const connect = useConnect();
  const { connection } = useConnection();
  const signers = useSigners();
  const source = accountId(connection?.address ?? "");
  const [fundedSource, setFundedSource] = useState<string>();
  const [preparing, setPreparing] = useState(false);
  const [setupError, setSetupError] = useState<unknown>();
  const ready = !!source && fundedSource === source;
  const counter = useContract(() =>
    new Counter({
      networkConfig: network,
      contractConfig: { contractId: id },
    }), [network, id]);
  const read = {
    contract: counter,
    method: "getCount" as const,
    args: [] as [],
  };
  const count = useContractRead(read);

  // A successful write invalidates the exact generated read key. The hook
  // cannot infer every other query a contract invocation might affect.
  const increment = useContractInvoke(counter, "increment", {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: contractReadQueryOptions(config, read).queryKey,
      }),
  });

  async function prepare() {
    setPreparing(true);
    setSetupError(undefined);
    try {
      // Generating a key does not create a ledger account. Keep this identity
      // local to this lesson and reuse it if funding needs to be retried.
      const identity = connection ?? await connect("practice-identity");
      const address = accountId(identity?.address ?? "");
      if (!address || !network.friendbotUrl) {
        throw new Error("Testnet setup is unavailable.");
      }

      // BTX_003 means the pipeline could not load its source. Friendbot creates
      // and funds it; rpcUrl makes this wait until our RPC can read it too.
      await initializeWithFriendbot(network.friendbotUrl, address, {
        rpcUrl: network.rpcUrl,
      });
      setFundedSource(address);
    } catch (cause) {
      setSetupError(cause);
    } finally {
      setPreparing(false);
    }
  }

  function invoke() {
    if (!source || !ready) return;

    // Explicit configuration keeps fee payer and signing capabilities visible.
    increment.mutate({
      methodArgs: { by: 1 },
      config: {
        source,
        signers: [...signers],
        fee: { base: "100" },
        timeout: 60,
      },
    });
  }
  return (
    <>
      <Note>
        Create and fund a signer here, then invoke the counter. This lesson owns
        its key; it never replaces the wallet in the header or uses a key from
        another lesson. Leaving the page destroys the key. The counter caps its
        count at 100; run deno task setup in examples/web for a fresh counter.
      </Note>
      <fieldset className="lesson-step">
        <legend>1. Prepare a Testnet signer</legend>
        <p>
          Friendbot creates the account and supplies Testnet XLM for fees.
          Invocation stays disabled until the account is visible through RPC.
        </p>
        <Actions>
          <button
            type="button"
            className="secondary"
            disabled={preparing || ready || increment.isPending}
            onClick={() => void prepare()}
          >
            {preparing && <Spinner />}
            {preparing
              ? "Funding and waiting for RPC…"
              : ready
              ? "Signer ready"
              : source
              ? "Retry funding signer"
              : "Create and fund signer"}
          </button>
        </Actions>
        <Value label="Lesson fee payer">{source ?? "Not created"}</Value>
        <p role="status">
          {ready
            ? "Account funded and visible through RPC."
            : "Complete setup before invoking."}
        </p>
        <Failure error={setupError} />
      </fieldset>
      <fieldset className="lesson-step">
        <legend>2. Invoke with explicit signers</legend>
        <p>
          The local signer signs without a wallet prompt. This writes +1 and
          pays a Soroban resource fee from the lesson account.
        </p>
        <Actions>
          <button
            type="button"
            disabled={!ready || !signers.length || increment.isPending}
            onClick={invoke}
          >
            Invoke increment (+1)
          </button>
        </Actions>
        <QueryState query={count}>
          {count.data !== undefined && (
            <Value label="Stored count">{count.data.toString()}</Value>
          )}
        </QueryState>
        <MutationState mutation={increment} />
        {increment.data && (
          <a href={`#transaction?hash=${increment.data.hash}`}>
            Inspect transaction →
          </a>
        )}
      </fieldset>
    </>
  );
}
export default function ContractInvoke() {
  const id = contractId(exampleCounter);
  return id
    ? (
      <PracticeProvider>
        <Invoke id={id} />
      </PracticeProvider>
    )
    : <FixtureRequired />;
}
