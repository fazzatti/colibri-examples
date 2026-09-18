import { useState } from "react";
import { useAccount } from "@colibri/react/accounts";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import {
  Actions,
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { formatAmount } from "../../components/amount.ts";

export default function Account() {
  const [input, setInput] = useState(exampleAccount);
  const [address, setAddress] = useState(accountId(exampleAccount));

  // A G-address identifies the ledger account. No wallet permission is needed.
  // Undefined disables the query; a missing account remains a visible error.
  const account = useAccount(address);

  return (
    <>
      <Note>
        Use any funded Testnet G-address, or run deno task setup to create the
        public example fixtures.
      </Note>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAddress(accountId(input));
        }}
      >
        <Field
          label="Account address"
          placeholder="G…"
          value={input}
          onChange={(event) => setInput(event.target.value.trim())}
        />
        <Actions>
          <button type="submit" disabled={!accountId(input)}>
            Read account
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!address || account.isFetching}
            onClick={() => void account.refetch()}
          >
            Refresh
          </button>
        </Actions>
      </form>
      <QueryState query={account}>
        {account.data && (
          <>
            <Value label="XLM balance">
              {formatAmount(account.data.balance, 7)}
            </Value>
            <Data value={account.data} />
          </>
        )}
      </QueryState>
    </>
  );
}
