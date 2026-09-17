import { useState } from "react";
import { Asset } from "@stellar/stellar-sdk";
import { useTrustline } from "@colibri/react/accounts";
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

export default function Trustline() {
  const [address, setAddress] = useState(exampleAccount);
  const [issuer, setIssuer] = useState(exampleIssuer);
  const owner = accountId(address);
  const assetIssuer = accountId(issuer);

  // This fixture holds GUIDE, a Classic issued asset. Its issuer is part of
  // its identity; another issuer's GUIDE would be a different asset.
  const trustline = useTrustline(
    owner && assetIssuer
      ? {
        accountId: owner,
        asset: new Asset("GUIDE", assetIssuer),
      }
      : undefined,
  );

  return (
    <>
      <Note>
        Run web:setup for an account with a GUIDE trustline, or enter another
        account and GUIDE issuer. A missing trustline is an error, not a zero
        balance.
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
      <QueryState query={trustline}>
        {trustline.data && (
          <>
            <Value label="GUIDE balance">
              {formatAmount(trustline.data.balance, 7)}
            </Value>
            <Data value={trustline.data} />
          </>
        )}
      </QueryState>
    </>
  );
}
