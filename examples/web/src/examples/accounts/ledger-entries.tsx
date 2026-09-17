import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useColibriConfig } from "@colibri/react";
import { useLedgerEntries } from "@colibri/react/accounts";
import { colibriQueryOptions } from "@colibri/react/query";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import { Data, Field, Note, QueryState } from "../../components/lesson.tsx";

export default function LedgerEntries() {
  const [input, setInput] = useState(exampleAccount);
  const address = accountId(input);
  const config = useColibriConfig();
  const entries = useLedgerEntries();

  // useLedgerEntries returns a stable reader, not query state. Compose one of
  // its known-key helpers with a network-scoped query when a dedicated hook
  // does not cover the ledger entry your application needs.
  const entry = useQuery(
    colibriQueryOptions(
      config,
      "guide-account-entry",
      address,
      () => entries.account({ accountId: address! }),
      { enabled: !!address },
    ),
  );

  return (
    <>
      <Note>
        This intentionally overlaps the account lesson to show the lower-level
        composition. The same reader also exposes contract data, offers and
        other ledger-key helpers.
      </Note>
      <Field
        label="Account G-address"
        value={input}
        onChange={(event) => setInput(event.target.value.trim())}
      />
      <QueryState query={entry}>
        {entry.data && <Data value={entry.data} />}
      </QueryState>
    </>
  );
}
