/**
 * Read a Classic issued-asset balance using its code and issuer identity.
 *
 * Use the GUIDE owner/issuer created by deno task setup, or enter matching
 * Testnet addresses. The outer component validates those addresses before
 * mounting Balance, whose useBalance call reads the owner's trustline. Compare
 * this asset-oriented result with accounts/trustline.tsx for the full ledger
 * entry. A missing trustline is an error; this read cannot create one or issue
 * GUIDE. A different issuer defines a different asset even with the same code.
 *
 * @module
 */
import { useState } from "react";
import { useBalance } from "@colibri/react/assets";
import {
  accountId,
  exampleAccount,
  exampleIssuer,
} from "../../setup/fixtures.ts";
import {
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { formatAmount } from "../../components/amount.ts";

function Balance(
  { address, issuer }: { address: `G${string}`; issuer: `G${string}` },
) {
  // A Classic asset is code + issuer. Reading its balance reads a trustline.
  const balance = useBalance(
    { kind: "classic", code: "GUIDE", issuer },
    address,
  );

  // Use the decimals carried by the balance result and keep raw as bigint.
  // The result object is present even for zero, so a zero balance still renders.
  return (
    <QueryState query={balance}>
      {balance.data && (
        <>
          <Value label="GUIDE">
            {formatAmount(balance.data.raw, balance.data.decimals)}
          </Value>
          <Data value={balance.data} />
        </>
      )}
    </QueryState>
  );
}
export default function ClassicBalance() {
  const [address, setAddress] = useState(exampleAccount);
  const [issuer, setIssuer] = useState(exampleIssuer);

  // Mount the querying child only after both addresses validate. This keeps
  // its hook unconditional and avoids constructing a half-specified asset
  // while the reader edits either field.
  const owner = accountId(address);
  const assetIssuer = accountId(issuer);
  return (
    <>
      <Note>
        setup issues 25 GUIDE to the fixture account. Classic assets have 7
        decimals; missing trustlines surface an error.
      </Note>
      <Field
        label="Account G-address"
        value={address}
        onChange={(event) => setAddress(event.target.value.trim())}
      />
      <Field
        label="GUIDE issuer G-address"
        value={issuer}
        onChange={(event) => setIssuer(event.target.value.trim())}
      />
      {owner && assetIssuer
        ? <Balance address={owner} issuer={assetIssuer} />
        : (
          <p className="muted">
            Enter both valid addresses to read the trustline.
          </p>
        )}
    </>
  );
}
