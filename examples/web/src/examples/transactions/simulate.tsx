import { useState } from "react";
import {
  Account,
  Contract,
  nativeToScVal,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useNetwork } from "@colibri/react";
import { useSimulateSorobanTransaction } from "@colibri/react/transactions/simulate";
import {
  accountId,
  contractId,
  exampleAccount,
  exampleCounter,
} from "../../setup/fixtures.ts";
import {
  Actions,
  Failure,
  Field,
  MutationState,
  Note,
} from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Simulate({ id }: { id: `C${string}` }) {
  const network = useNetwork();
  const simulation = useSimulateSorobanTransaction();
  const [address, setAddress] = useState(exampleAccount);
  const [error, setError] = useState<unknown>();
  const source = accountId(address);

  function simulate() {
    if (!source) return;
    setError(undefined);
    try {
      // Simulation accepts a prepared native transaction. The placeholder
      // sequence is valid only for simulation; do not submit this envelope.
      const operation = new Contract(id).call(
        "increment",
        nativeToScVal(1, { type: "u32" }),
      );
      const transaction = new TransactionBuilder(new Account(source, "0"), {
        fee: "100",
        networkPassphrase: network.networkPassphrase,
      }).addOperation(operation).setTimeout(60).build();
      simulation.mutate(transaction);
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <>
      <Note>
        Simulate increment(+1) and inspect resource/auth requirements. The
        stored count stays unchanged. No wallet signature, submission or fee
        payment occurs. Successful simulation does not guarantee later
        submission.
      </Note>
      <Field
        label="Simulation source G-address"
        value={address}
        onChange={(event) => setAddress(event.target.value.trim())}
      />
      <Actions>
        <button
          type="button"
          disabled={!source || simulation.isPending}
          onClick={simulate}
        >
          Simulate increment
        </button>
        <a className="button secondary" href="#contract-read">
          Check stored count →
        </a>
      </Actions>
      <Failure error={error} />
      <MutationState mutation={simulation} />
    </>
  );
}
export default function SorobanSimulation() {
  const id = contractId(exampleCounter);
  return id ? <Simulate id={id} /> : <FixtureRequired />;
}
