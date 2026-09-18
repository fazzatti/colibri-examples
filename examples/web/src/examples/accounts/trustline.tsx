/**
 * Read the GUIDE trustline belonging to a public Testnet account.
 *
 * Run deno task setup for an account holding GUIDE, or supply your own account
 * and GUIDE issuer. useTrustline needs both the owner and the asset's code/issuer
 * identity. It exposes the trustline entry, including balance and limits; it
 * does not create a trustline or issue tokens. Follow validation into the query,
 * then inspect the returned entry. Missing trustlines remain errors instead of
 * being presented as a balance of zero.
 *
 * @module
 */
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

  // Validate both G-addresses before constructing the Classic asset. A query
  // is useful only when its owner and issuer are complete; neither field
  // requires connecting the wallet that controls that address.
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

  // Show both a formatted balance and the full entry so readers can inspect
  // limits and flags as well. Classic asset amounts use seven decimal places;
  // formatAmount preserves the exact integer instead of rounding through Number.
  return (
    <>
      <Note>
        Run setup for an account with a GUIDE trustline, or enter another
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
