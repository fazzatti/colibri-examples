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
  const [firstClient] = useState(counter);

  return (
    <>
      <Note>
        The client is generated offline from the counter's Wasm by web:install.
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
export default function ContractInstance() {
  const id = contractId(exampleCounter);
  return id ? <Client id={id} /> : <FixtureRequired />;
}
