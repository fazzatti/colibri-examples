/**
 * Read SEP-41 token metadata and balances through a contract address.
 *
 * The default token is Testnet's native XLM Stellar Asset Contract (SAC).
 * Enter another SEP-41 contract to compare its metadata, then enter a G- or
 * C-address balance owner. useTokenMetadata and useBalance are separate queries:
 * metadata can load before a valid owner is supplied. Follow the contract/owner
 * validation and use the returned decimals for display. Arbitrary SEP-41 tokens
 * need not represent Classic assets or use XLM's seven decimal places.
 *
 * @module
 */
import { useState } from "react";
import { useBalance, useTokenMetadata } from "@colibri/react/assets";
import {
  accountId,
  contractId,
  exampleAccount,
  nativeToken,
} from "../../setup/fixtures.ts";
import {
  Data,
  Field,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { formatAmount } from "../../components/amount.ts";

function Token(
  { id, address }: { id: `C${string}`; address?: `G${string}` | `C${string}` },
) {
  // SEP-41 identifies a token by contract ID, including a Stellar Asset
  // Contract (SAC). A custom SEP-41 token is not necessarily a Classic asset.
  const metadata = useTokenMetadata(id);
  const balance = useBalance({ kind: "sep41", contractId: id }, address);

  // Render the two observations independently: token metadata can succeed
  // without an owner balance. Format the balance with its own declared decimals,
  // keeping the raw integer exact for tokens with different precision.
  return (
    <>
      <QueryState query={metadata}>
        {metadata.data && (
          <>
            <Value label="Token">
              {metadata.data.name} ({metadata.data.symbol})
            </Value>
            <Data value={metadata.data} />
          </>
        )}
      </QueryState>
      <QueryState query={balance}>
        {balance.data && (
          <>
            <Value label="Token balance">
              {formatAmount(balance.data.raw, balance.data.decimals)}
            </Value>
            <Data value={balance.data} />
          </>
        )}
      </QueryState>
    </>
  );
}
export default function TokenBalance() {
  const [token, setToken] = useState(nativeToken);
  const [address, setAddress] = useState(exampleAccount);
  const id = contractId(token);

  // SEP-41 balances can belong to accounts or contracts. Accept either
  // StrKey form, while requiring the token itself to have a contract address.
  const owner = accountId(address) ?? contractId(address);
  return (
    <>
      <Note>
        The default is Testnet's native XLM SAC, which implements SEP-41. You
        can enter another Testnet token. Precision is read from decimals(),
        never assumed to be 7 for arbitrary tokens.
      </Note>
      <Field
        label="Token contract C-address"
        value={token}
        onChange={(event) => setToken(event.target.value.trim())}
      />
      <Field
        label="Balance owner G- or C-address"
        value={address}
        onChange={(event) => setAddress(event.target.value.trim())}
      />
      {id
        ? <Token id={id} address={owner} />
        : <p className="muted">Enter a valid contract ID.</p>}
    </>
  );
}
