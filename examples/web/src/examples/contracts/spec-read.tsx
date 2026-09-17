import { useContractReadSpec } from "@colibri/react/contracts/read";
import { CounterSpec } from "../../generated/counter/constants.ts";
import { contractId, exampleCounter } from "../../setup/fixtures.ts";
import { Actions, Note, QueryState, Value } from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Read({ id }: { id: `C${string}` }) {
  // The standalone path uses the exact ABI spelling and a loaded Spec.
  // Its observer-level decoder narrows the otherwise unknown returned value.
  const count = useContractReadSpec({
    contractId: id,
    spec: CounterSpec,
    method: "get_count",
  }, (value) => {
    if (typeof value !== "number") {
      throw new Error("Expected a u32 counter value.");
    }
    return value;
  });
  return (
    <>
      <Note>
        This path needs an ABI and deployment, but no full Contract client. The
        embedded spec describes encoding; it does not verify that a deployment
        contains the expected Wasm.
      </Note>
      <Actions>
        <button
          type="button"
          disabled={count.isFetching}
          onClick={() => void count.refetch()}
        >
          Read from spec
        </button>
      </Actions>
      <QueryState query={count}>
        {count.data !== undefined && (
          <Value label="Stored count">{count.data}</Value>
        )}
      </QueryState>
    </>
  );
}
export default function SpecRead() {
  const id = contractId(exampleCounter);
  return id ? <Read id={id} /> : <FixtureRequired />;
}
