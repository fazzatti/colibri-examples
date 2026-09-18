/**
 * Read the deployed Counter using a generated client's typed method helper.
 *
 * Run deno task setup for the Testnet counter ID. useContract retains the client,
 * then useContractRead calls its getCount.read() helper and exposes query state.
 * Follow the empty argument list, inspect the count and request another read
 * with the button. Reads simulate execution; they do not persist contract
 * changes or request a wallet signature. spec-read.tsx shows the alternative
 * when the application has an ABI but does not need the full generated client.
 *
 * @module
 */
import { useNetwork } from "@colibri/react";
import { useContract } from "@colibri/react/contracts";
import { useContractRead } from "@colibri/react/contracts/read";
import { Counter } from "../../generated/counter/index.ts";
import { contractId, exampleCounter } from "../../setup/fixtures.ts";
import { Actions, Note, QueryState, Value } from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Read({ id }: { id: `C${string}` }) {
  const network = useNetwork();

  // Bind the generated API to this deployment on the provider's Testnet
  // network. Include both dependencies so a changed configuration cannot leave
  // reads attached to an old client.
  const counter = useContract(() =>
    new Counter({
      networkConfig: network,
      contractConfig: { contractId: id },
    }), [network, id]);

  // Generated helper names use camelCase. The hook calls getCount.read()
  // through this existing client and infers the return type from the helper.
  const count = useContractRead({
    contract: counter,
    method: "getCount",
    args: [],
  });

  // Refetch reruns the same read. Check data against undefined below so the
  // counter's valid initial value of zero is displayed instead of hidden.
  return (
    <>
      <Note>
        A contract read is a simulation. It does not commit state, even when the
        selected method is capable of changing state.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={count.isFetching}
          onClick={() => void count.refetch()}
        >
          Read count again
        </button>
      </Actions>
      <QueryState query={count}>
        {count.data !== undefined && (
          <Value label="Stored count">{count.data.toString()}</Value>
        )}
      </QueryState>
    </>
  );
}
export default function ContractRead() {
  const id = contractId(exampleCounter);
  return id ? <Read id={id} /> : <FixtureRequired />;
}
