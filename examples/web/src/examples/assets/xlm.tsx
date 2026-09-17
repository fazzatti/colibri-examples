import { useState } from "react";
import { useBalance } from "@colibri/react/assets";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import {
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { formatAmount } from "../../components/amount.ts";

export default function XlmBalance() {
  const [address, setAddress] = useState(exampleAccount);

  // Native XLM is a distinct identity. raw is bigint stroops, with 7 decimals.
  const balance = useBalance({ kind: "xlm" }, accountId(address));

  return (
    <>
      <Note>
        A public balance read needs no wallet. This is the ledger balance, not
        an estimate of the spendable balance after reserves and liabilities.
      </Note>
      <Field
        label="Account G-address"
        value={address}
        onChange={(event) => setAddress(event.target.value.trim())}
      />
      <QueryState query={balance}>
        {balance.data && (
          <>
            <Value label="XLM">
              {formatAmount(balance.data.raw, balance.data.decimals)}
            </Value>
            <Value label="Raw stroops">{balance.data.raw.toString()}</Value>
            <Data value={balance.data} />
          </>
        )}
      </QueryState>
    </>
  );
}
