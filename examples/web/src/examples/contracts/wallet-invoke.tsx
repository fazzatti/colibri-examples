import { useNetwork } from "@colibri/react";
import { useWallet } from "@colibri/react/wallet";
import { useAccount } from "@colibri/react/accounts";
import { TestnetAccountSetup } from "../../components/testnet-account-setup.tsx";
import { useContract } from "@colibri/react/contracts";
import { useContractRead } from "@colibri/react/contracts/read";
import { useWalletContractInvoke } from "@colibri/react/contracts/invoke";
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
  const wallet = useWallet();
  const source = accountId(wallet.address ?? "");
  const account = useAccount(source, { retry: false });
  const counter = useContract(() =>
    new Counter({
      networkConfig: network,
      contractConfig: { contractId: id },
    }), [network, id]);
  const count = useContractRead({
    contract: counter,
    method: "getCount",
    args: [],
  });

  // The convenience derives source and guarded signers from the current
  // connection. Explicit fees and timeout remain visible at the call site.
  const increment = useWalletContractInvoke(counter, "increment", {
    onSuccess: () => {
      void count.refetch();
    },
  });
  return (
    <>
      <Note>
        This commits the same +1 operation as the explicit-signer lesson. A
        wallet supplies authority only when the button is clicked; rendering
        never opens a signing prompt.
      </Note>
      <TestnetAccountSetup
        key={source ?? "disconnected"}
        address={source}
        account={account}
      />
      <Actions>
        <button
          type="button"
          disabled={!account.isSuccess || !wallet.signers.length ||
            increment.isPending}
          onClick={() =>
            increment.mutate({
              methodArgs: { by: 1 },
              config: { fee: { base: "100" }, timeout: 60 },
            })}
        >
          Invoke with connected wallet (+1)
        </button>
      </Actions>
      <QueryState query={count}>
        {count.data !== undefined && (
          <Value label="Stored count">{count.data.toString()}</Value>
        )}
      </QueryState>
      <MutationState mutation={increment} />
    </>
  );
}
export default function WalletInvoke() {
  const id = contractId(exampleCounter);
  return id ? <Invoke id={id} /> : <FixtureRequired />;
}
