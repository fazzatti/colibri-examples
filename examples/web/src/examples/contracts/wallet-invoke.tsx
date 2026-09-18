/**
 * Invoke Counter using authority derived from the selected connection.
 *
 * Choose a local signer or compatible connected wallet, then check/fund its
 * Testnet account on this page. The counter comes from deno task setup.
 * useWalletContractInvoke obtains source/signers from the nearest provider;
 * the button still supplies method arguments, fees and timeout. On success,
 * refetch getCount to observe the committed increment. Compare invoke.tsx for
 * explicit authority. The "wallet" hook also works with the local connector.
 *
 * @module
 */
import { SignerProvider } from "../../setup/signer-provider.tsx";
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

  // useWallet reads the selected lesson provider, which may hold a local
  // connector. Check that source's ledger account before enabling a write;
  // connecting or generating a key alone cannot make it pay transaction fees.
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
      // This page has one affected read, so request it again after success.
      // The explicit-invoke lesson shows invalidating a precise shared query key.
      void count.refetch();
    },
  });

  // The button passes only arguments and transaction policy. Source/signers
  // are intentionally omitted because this hook obtains guarded authority from
  // the connection when invoked. The base fee is separate from Soroban resources.
  return (
    <>
      <Note>
        This commits the same +1 operation as the explicit-signer lesson. The
        selected local or wallet connection supplies authority only on action;
        rendering never opens a signing prompt.
      </Note>
      <TestnetAccountSetup
        key={source ?? "disconnected"}
        address={source}
        account={account}
        label="Transaction source"
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
          Invoke with selected connection (+1)
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

// Require the deployment, then offer both signer sources inside this lesson.
// No signer choice or funded account from an earlier lesson is required.
export default function WalletInvoke() {
  const id = contractId(exampleCounter);
  return id
    ? (
      <SignerProvider>
        <Invoke id={id} />
      </SignerProvider>
    )
    : <FixtureRequired />;
}
