import { useNetwork } from "@colibri/react";
import { useContract } from "@colibri/react/contracts";
import { useContractRead } from "@colibri/react/contracts/read";
import { Counter } from "../../generated/counter/index.ts";
import { contractId, exampleCounter } from "../../setup/fixtures.ts";
import { Actions, Note, QueryState, Value } from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Read({ id }: { id: `C${string}` }) {
  const network = useNetwork();
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
