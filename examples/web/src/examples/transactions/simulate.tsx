/**
 * Simulate a native Soroban transaction without committing its increment.
 *
 * Use the counter and public source address from deno task setup, or enter a
 * suitable Testnet source. Follow the ABI argument encoding into a prepared
 * TransactionBuilder envelope and useSimulateSorobanTransaction. Inspect the
 * resource/authorization result, then compare the stored count in the read
 * lesson. No signature or fee payment occurs. The placeholder sequence belongs
 * only to this simulation; soroban.tsx builds a fresh transaction for submission.
 *
 * @module
 */
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

      // Return simulation data through mutation state for inspection. An RPC
      // simulation error is reported there; the catch below handles errors from
      // building the native operation/envelope before the request starts.
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

// Simulation needs a deployment and a source address but no signing handle.
// Keep it outside SignerProvider so observing resources never prompts a wallet.
export default function SorobanSimulation() {
  const id = contractId(exampleCounter);
  return id ? <Simulate id={id} /> : <FixtureRequired />;
}
