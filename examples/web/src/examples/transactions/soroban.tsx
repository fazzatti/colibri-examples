/**
 * Submit a native Soroban operation through Colibri's full transaction pipeline.
 *
 * Use the counter from deno task setup, choose a local signer or wallet, and
 * check/fund its Testnet account on this page. This variant makes the raw
 * increment operation and u32 argument encoding visible instead of calling a
 * generated helper. useSorobanTransaction builds and prepares the transaction,
 * requests signatures and submits it. Unlike simulate.tsx, this commits +1 and
 * charges fees; use the returned hash to inspect the network result.
 *
 * @module
 */
import { SignerProvider } from "../../setup/signer-provider.tsx";
import { Contract, nativeToScVal } from "@stellar/stellar-sdk";
import { useWallet } from "@colibri/react/wallet";
import { useAccount } from "@colibri/react/accounts";
import { TestnetAccountSetup } from "../../components/testnet-account-setup.tsx";
import { useSorobanTransaction } from "@colibri/react/transactions/soroban";
import { accountId, contractId, exampleCounter } from "../../setup/fixtures.ts";
import {
  Actions,
  MutationState,
  Note,
  Value,
} from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Submit({ id }: { id: `C${string}` }) {
  const wallet = useWallet();
  const transaction = useSorobanTransaction();

  // Take authority from the source selected on this page, then check its
  // ledger account. TestnetAccountSetup can fund that same address without
  // replacing its key or changing the external wallet shown in the header.
  const source = accountId(wallet.address ?? "");
  const account = useAccount(source, { retry: false });

  function submit() {
    if (!source || !account.isSuccess) return;

    // This lower-level path keeps the native operation and ABI encoding visible.
    // The pipeline builds, simulates, authorizes, assembles, signs and submits.
    const operation = new Contract(id).call(
      "increment",
      nativeToScVal(1, { type: "u32" }),
    );

    // Supply the operation, not the placeholder envelope from simulation.tsx.
    // The pipeline obtains current source state. base is the per-operation fee
    // in stroops; Soroban resource fees are prepared in addition.
    transaction.mutate({
      operations: [operation],
      config: {
        source,
        signers: [...wallet.signers],
        fee: { base: "100" },
        timeout: 60,
      },
    });
  }
  return (
    <>
      <Note>
        This commits increment(+1), unlike the simulation lesson. Choose a local
        signer or wallet above, then fund its source below to pay the fee. The
        prepared simulation envelope is not reused; the pipeline obtains current
        account state.
      </Note>
      <TestnetAccountSetup
        key={source ?? "disconnected"}
        address={source}
        account={account}
        label="Transaction source"
      />
      <Value label="Fee payer">{source ?? "Choose a signer above"}</Value>
      <Actions>
        <button
          type="button"
          disabled={!account.isSuccess || !wallet.signers.length ||
            transaction.isPending}
          onClick={submit}
        >
          Submit Soroban increment (+1)
        </button>
      </Actions>
      <MutationState mutation={transaction} />
      {transaction.data && (
        <a href={`#transaction?hash=${transaction.data.hash}`}>
          Inspect transaction →
        </a>
      )}
    </>
  );
}

// Mount signing controls only once the public contract fixture is available.
// The provider resets results on source changes and releases local keys on exit.
export default function SorobanTransaction() {
  const id = contractId(exampleCounter);
  return id
    ? (
      <SignerProvider>
        <Submit id={id} />
      </SignerProvider>
    )
    : <FixtureRequired />;
}
