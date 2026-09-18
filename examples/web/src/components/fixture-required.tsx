import { Note } from "./lesson.tsx";

export function FixtureRequired() {
  return (
    <Note>
      Run <code>deno task setup</code>{" "}
      from examples/web, then reload this page. It deploys the counter to
      Testnet and writes only public identifiers into{" "}
      <code>examples/web/.env.local</code>. The counter starts at zero and has a
      limit of 100; rerun setup for a fresh instance. Existing deployments can
      also be set with <code>VITE_EXAMPLE_COUNTER</code>.
    </Note>
  );
}
