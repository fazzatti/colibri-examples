/**
 * Read native XLM through the asset-oriented useBalance hook.
 *
 * Enter a funded Testnet G-address or use the public setup fixture. The XLM asset
 * identity selects an account balance read, with raw bigint stroops and seven
 * decimal places. Compare the exact raw value with its formatted display below.
 * This public query neither connects a wallet nor moves funds, and its ledger
 * balance is not a calculation of spendable XLM after reserves and liabilities.
 *
 * @module
 */
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
  // Unlike the submit-to-read account lesson, this form feeds the query as
  // soon as accountId accepts a complete G-address. Partial input becomes
  // undefined, leaving the balance query waiting for an address.
  const [address, setAddress] = useState(exampleAccount);

  // Native XLM is a distinct identity. raw is bigint stroops, with 7 decimals.
  const balance = useBalance({ kind: "xlm" }, accountId(address));

  // Keep raw as bigint through formatting: dividing a Number could lose
  // precision. Displaying raw stroops beside XLM makes the unit conversion
  // visible without confusing the total ledger balance with spendable funds.
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
