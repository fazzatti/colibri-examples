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
