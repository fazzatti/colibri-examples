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
  const owner = accountId(address);
  const assetIssuer = accountId(issuer);
  return (
    <>
      <Note>
        web:setup issues 25 GUIDE to the fixture account. Classic assets have 7
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
