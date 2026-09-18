/**
 * Read Counter directly from its ABI with useContractReadSpec.
 *
 * Use the Testnet deployment created by deno task setup and the generated
 * CounterSpec. This variant supplies the contract's exact get_count ABI name
 * without constructing Counter. The decoder checks the returned value before
 * the UI treats it as a number. Compare read.tsx for generated helper type
 * inference. This is a simulation with no committed write or wallet approval;
 * a local ABI describes calls but does not prove the deployed code's identity.
 *
 * @module
 */
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
    // Without a generated method helper, make the expected decoded shape
    // explicit. An unexpected result becomes a query error, not a displayed count.
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

// Reuse the same deployment fixture as the generated-client lesson so both
// paths can be compared against the same stored counter value.
export default function SpecRead() {
  const id = contractId(exampleCounter);
  return id ? <Read id={id} /> : <FixtureRequired />;
}
