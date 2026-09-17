import { useQueryClient } from "@tanstack/react-query";
import { useColibriConfig, useNetwork } from "@colibri/react";
import { useWallet } from "@colibri/react/wallet";
import { useSigners } from "@colibri/react/signers";
import { useContract } from "@colibri/react/contracts";
import {
  contractReadQueryOptions,
  useContractRead,
} from "@colibri/react/contracts/read";
import { useContractInvoke } from "@colibri/react/contracts/invoke";
import { Counter } from "../../generated/counter/index.ts";
import { accountId, contractId, exampleCounter } from "../../setup/fixtures.ts";
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
  const wallet = useWallet();
  const signers = useSigners();
  const source = accountId(wallet.address ?? "");
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
  function invoke() {
    if (!source) return;

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
        Connect a funded Testnet wallet. This writes +1 to the example counter
        and pays a Soroban resource fee. The contract caps its count at 100;
        regenerate fixtures for a fresh counter.
      </Note>
      <Value label="Fee payer">{source ?? "Connect a wallet first"}</Value>
      <Actions>
        <button
          type="button"
          disabled={!source || !signers.length || increment.isPending}
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
    </>
  );
}
export default function ContractInvoke() {
  const id = contractId(exampleCounter);
  return id ? <Invoke id={id} /> : <FixtureRequired />;
}
