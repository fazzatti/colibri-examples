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
        This commits increment(+1), unlike the simulation lesson. Connect a
        funded Testnet wallet to pay the fee. The prepared simulation envelope
        is not reused; the pipeline obtains current account state.
      </Note>
      <TestnetAccountSetup
        key={source ?? "disconnected"}
        address={source}
        account={account}
      />
      <Value label="Fee payer">{source ?? "Connect a wallet first"}</Value>
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
export default function SorobanTransaction() {
  const id = contractId(exampleCounter);
  return id ? <Submit id={id} /> : <FixtureRequired />;
}
