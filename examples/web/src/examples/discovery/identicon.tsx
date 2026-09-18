/**
 * Compare useIdenticon with the ready-made AccountIdenticon component.
 *
 * Enter a valid G- or C-address; the public fixture or native token address
 * provides an initial value. Both render the same deterministic image locally,
 * without a wallet, funded account or RPC request. Follow address validation into
 * the data-URL hook and compare it with the component rendering. The visual
 * pattern helps recognize an address but does not authenticate its owner.
 *
 * @module
 */
import { useState } from "react";
import { AccountIdenticon, useIdenticon } from "@colibri/react/identicon";
import {
  accountId,
  contractId,
  exampleAccount,
  nativeToken,
} from "../../setup/fixtures.ts";
import { Field, Note, Value } from "../../components/lesson.tsx";

export default function Identicon() {
  const [input, setInput] = useState(exampleAccount || nativeToken);

  // Validate the identifier before rendering. An address can have an identicon
  // even if it has never been funded or deployed; this check concerns its
  // encoding, not existence on the network.
  const address = accountId(input) ?? contractId(input);

  // This hook renders locally and needs no RPC. G-addresses follow SEP-33;
  // C-address rendering is Colibri's extension of the same identity pattern.
  const image = useIdenticon(address, { size: 96 });
  return (
    <>
      <Note>
        Compare the hook's data URL and the optional AccountIdenticon component.
        Both represent the same address; an identicon is a visual aid, not
        identity verification.
      </Note>
      <Field
        label="G- or C-address"
        value={input}
        onChange={(event) => setInput(event.target.value.trim())}
      />
      {image && address && (
        <div className="icon-preview">
          <div>
            <img
              src={image}
              width={96}
              height={96}
              alt="Identicon from useIdenticon"
            />
            <Value label="Hook">SVG data URL</Value>
          </div>
          <div>
            <AccountIdenticon
              address={address}
              size={96}
              alt="Identicon from AccountIdenticon"
            />
            <Value label="Component">Same address</Value>
          </div>
        </div>
      )}
    </>
  );
}
