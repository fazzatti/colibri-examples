/**
 * Invoke Counter with an explicit fee payer and signer list, then refresh its read.
 *
 * Run deno task setup for the counter, choose a local signer or connected wallet
 * on this page, and check/fund its Testnet account here. Follow the generated
 * client and getCount query into useContractInvoke and the invoke() click handler.
 * The call commits +1 and pays fees; success invalidates the affected read key.
 * No earlier lesson prepares this source. Compare wallet-invoke.tsx, where the
 * hook derives authority from the selected connection instead of call arguments.
 *
 * @module
 */
import { useQueryClient } from "@tanstack/react-query";
import { useColibriConfig, useConnection, useNetwork } from "@colibri/react";
import { useAccount } from "@colibri/react/accounts";
import { TestnetAccountSetup } from "../../components/testnet-account-setup.tsx";
import { useSigners } from "@colibri/react/signers";
import { useContract } from "@colibri/react/contracts";
import {
  contractReadQueryOptions,
  useContractRead,
} from "@colibri/react/contracts/read";
import { useContractInvoke } from "@colibri/react/contracts/invoke";
import { Counter } from "../../generated/counter/index.ts";
import { accountId, contractId, exampleCounter } from "../../setup/fixtures.ts";
import { SignerProvider } from "../../setup/signer-provider.tsx";
import {
  Actions,
  MutationState,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Invoke({ id }: { id: `C${string}` }) {
  const network = useNetwork();
  const config = useColibriConfig();
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const signers = useSigners();

  // The selected signer owns a key, but fees require an actual ledger account.
  // Check the selected G-address through RPC and let TestnetAccountSetup fund it
  // here. Disable automatic retries so an unfunded source remains actionable.
  const source = accountId(connection?.address ?? "");
  const account = useAccount(source, { retry: false });
  const counter = useContract(() =>
    new Counter({
      networkConfig: network,
      contractConfig: { contractId: id },
    }), [network, id]);

  // Keep a single read descriptor for both observation and invalidation.
  // Reconstructing a different key after the write could leave this count stale.
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

  // Creating the mutation hook does not execute the pipeline. The click handler
  // starts it only after the source account is available; its pending state
  // covers preparation, signing, submission and confirmation.
  function invoke() {
    if (!source || !account.isSuccess) return;

    // Explicit configuration keeps fee payer and signing capabilities visible.
    increment.mutate({
      methodArgs: { by: 1 },
      config: {
        source,
        signers: [...signers],
        // Base fee is in stroops; the Soroban pipeline also prepares the
        // resource fee. This is not a cap of 100 stroops on the total fee.
        fee: { base: "100" },
        timeout: 60,
      },
    });
  }
  return (
    <>
      <Note>
        Choose a local signer or the wallet above, then check or fund its
        Testnet account here. A generated key alone cannot pay fees. The counter
        caps its count at 100; run deno task setup in examples/web for a fresh
        counter.
      </Note>
      <TestnetAccountSetup
        key={source ?? "unselected"}
        address={source}
        account={account}
        label="Transaction source"
      />
      <fieldset className="lesson-step">
        <legend>Invoke with explicit signers</legend>
        <p>
          This writes +1 and pays a Soroban resource fee from the selected
          source. A local signer signs in memory; a wallet asks for approval.
        </p>
        <Actions>
          <button
            type="button"
            disabled={!account.isSuccess || !signers.length ||
              increment.isPending}
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

// Give this page its own signer choice and local-key lifetime. Provider
// changes reset the lesson's forms/results; the app wallet stays in the header.
export default function ContractInvoke() {
  const id = contractId(exampleCounter);
  return id
    ? (
      <SignerProvider>
        <Invoke id={id} />
      </SignerProvider>
    )
    : <FixtureRequired />;
}
