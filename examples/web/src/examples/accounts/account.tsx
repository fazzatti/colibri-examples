/**
 * Read a public Testnet account with useAccount and inspect its ledger data.
 *
 * Enter an existing G-address or use the optional account from deno task setup.
 * The input is a draft: submitting chooses the address observed by the hook,
 * while Refresh reads that same account again. Trace address validation before
 * the query, then QueryState and the balance display. A well-formed public key
 * may have no ledger account; that lookup error stays visible. This lesson needs
 * neither a connected wallet nor a signature.
 *
 * @module
 */
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
  // Separate draft input from the address being observed. Typing alone does
  // not replace the current query; submitting validates and selects the next
  // account. Refresh below reuses the already-selected address.
  const [input, setInput] = useState(exampleAccount);
  const [address, setAddress] = useState(accountId(exampleAccount));

  // A G-address identifies the ledger account. No wallet permission is needed.
  // Undefined disables the query; a missing account remains a visible error.
  const account = useAccount(address);

  // The balance is an exact integer with seven decimal places. formatAmount
  // formats it without floating-point conversion; QueryState keeps loading and
  // lookup errors visible alongside the returned public account data.
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
