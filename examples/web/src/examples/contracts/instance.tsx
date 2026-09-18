/**
 * Keep a generated Counter client stable across ordinary React rerenders.
 *
 * Install generates src/generated/counter from the local Wasm; deno task setup
 * separately supplies a Testnet deployment ID. Follow useContract's factory and
 * dependencies, inspect the generated ABI, then press Rerender component to
 * compare object identity. Constructing and inspecting this client does not
 * invoke the contract. read.tsx adds a query to the same client pattern; the
 * buttons here change only local React state or navigate to that lesson.
 *
 * @module
 */
import { useState } from "react";
import { useNetwork } from "@colibri/react";
import { useContract } from "@colibri/react/contracts";
import { Counter } from "../../generated/counter/index.ts";
import { contractId, exampleCounter } from "../../setup/fixtures.ts";
import { Actions, Note, Value } from "../../components/lesson.tsx";
import { FixtureRequired } from "../../components/fixture-required.tsx";

function Client({ id }: { id: `C${string}` }) {
  const network = useNetwork();
  const [renders, setRenders] = useState(0);

  // Keep the generated subclass, embedded ABI and owned pipelines together.
  // Recreate it only when the network or deployment changes, not every render.
  const counter = useContract(() =>
    new Counter({
      networkConfig: network,
      contractConfig: { contractId: id },
    }), [network, id]);

  // Retain the initial reference only for this identity demonstration. The
  // button changes unrelated React state; equality should remain true while
  // the network and deployment dependencies are unchanged.
  const [firstClient] = useState(counter);

  return (
    <>
      <Note>
        The client is generated offline from the counter's Wasm by install.
        Inspect src/generated/counter/index.ts and its typed method helpers.
        Generation and Testnet deployment are separate steps.
      </Note>
      <Value label="Contract ID">{counter.getContractId()}</Value>
      <Value label="ABI functions">
        {counter.getSpec().funcs().map((fn) => fn.name.toString()).join(", ")}
      </Value>
      <Value label="Same client after rerender">
        {String(counter === firstClient)} · {renders} local updates
      </Value>
      <Actions>
        <button type="button" onClick={() => setRenders(renders + 1)}>
          Rerender component
        </button>
        <a className="button secondary" href="#contract-read">
          Read this client →
        </a>
      </Actions>
    </>
  );
}

// The generated class describes the contract API; it does not deploy it.
// Require the public deployment fixture before mounting the client lesson.
export default function ContractInstance() {
  const id = contractId(exampleCounter);
  return id ? <Client id={id} /> : <FixtureRequired />;
}
