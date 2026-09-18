/**
 * Sign a SEP-53 message, inspect its bytes, then verify it as a separate step.
 *
 * Choose a local signer or a wallet with message-signing support. Follow sign()
 * from useSignMessage to the hexadecimal output and editable verification form.
 * Then follow verify(), which checks only the supplied public key, text and
 * signature; it works even without a selected signer. Altering the text should
 * produce a mismatch. No ledger account, funding or transaction is required.
 * SignerProvider resets the lesson when its source changes and owns local keys.
 *
 * @module
 */
import { useState } from "react";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { useConnection } from "@colibri/react";
import { useSignMessage } from "@colibri/react/signers";
import { SignerProvider } from "../../setup/signer-provider.tsx";
import {
  Actions,
  Failure,
  Field,
  Note,
  Spinner,
} from "../../components/lesson.tsx";

function MessageExample() {
  // Read identity and message-signing authority from the same selected
  // provider. A connected address is insufficient without messageSigner;
  // the Sign button below checks that capability before starting the mutation.
  const { connection } = useConnection();
  const signing = useSignMessage();
  const [message, setMessage] = useState("Approve document revision 42.");
  const [signedHex, setSignedHex] = useState("");

  // Keep verification inputs independent from the compose field. They record
  // the last signed values or pasted public data; editing them clears the
  // verification result so it cannot describe a different message.
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationKey, setVerificationKey] = useState("");
  const [verificationHex, setVerificationHex] = useState("");
  const [verification, setVerification] = useState<boolean>();
  const [signError, setSignError] = useState<unknown>();
  const [verifyError, setVerifyError] = useState<unknown>();
  const [copyStatus, setCopyStatus] = useState("");

  async function sign() {
    if (!connection) return;
    setSignError(undefined);
    setSignedHex("");
    setCopyStatus("");
    try {
      // Capture the exact message and key before awaiting a signer. SEP-53
      // separates message signatures from transaction-envelope signatures.
      const submittedMessage = message;
      const publicKey = connection.address;
      const signature = await signing.mutateAsync(submittedMessage);

      // Convert bytes to fixed-width pairs, retaining leading zeroes. Hex is
      // an exchange/display format; verification converts it back to bytes.
      const hex = Array.from(
        signature,
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      setSignedHex(hex);

      // Populate a separate, editable verification form. Signing does not
      // verify: the developer explicitly performs that second operation.
      setVerificationMessage(submittedMessage);
      setVerificationKey(publicKey);
      setVerificationHex(hex);
      setVerification(undefined);
      setVerifyError(undefined);
    } catch (cause) {
      setSignError(cause);
    }
  }

  function verify() {
    setVerification(undefined);
    setVerifyError(undefined);
    try {
      // A 64-byte Ed25519 signature is 128 hex characters. Check its encoding
      // before conversion so malformed input cannot be silently truncated.
      const hex = verificationHex.trim();
      if (!/^[a-fA-F0-9]{128}$/.test(hex)) {
        throw new Error(
          "Enter a 64-byte signature as 128 hexadecimal characters (without 0x).",
        );
      }
      const signature = Uint8Array.from(
        hex.match(/.{2}/g)!,
        (byte) => Number.parseInt(byte, 16),
      );

      // Verification requires only public data and works without a connection.
      // verifyMessage applies SEP-53; raw verify() is a different operation.
      const publicKey = verificationKey.trim();
      if (!StrKey.isValidEd25519PublicKey(publicKey)) {
        throw new Error(
          "Enter a valid Stellar G-address for the signer public key.",
        );
      }
      const verifier = Keypair.fromPublicKey(publicKey);
      setVerification(verifier.verifyMessage(verificationMessage, signature));
    } catch (cause) {
      setVerifyError(cause);
    }
  }

  async function copySignature() {
    try {
      await navigator.clipboard.writeText(signedHex);
      setCopyStatus("Signature copied.");
    } catch {
      setCopyStatus(
        "Copy was unavailable. Select and copy the signature field manually.",
      );
    }
  }

  return (
    <>
      <Note>
        Use the selected local signer or wallet to sign a SEP-53 message.
        Signing needs no funded account and submits no transaction. A wallet
        prompts for approval; a local signer signs in memory. Verification below
        needs only public data, even without selecting a signer.
      </Note>
      <fieldset className="lesson-step">
        <legend>Sign the message</legend>
        <label className="field">
          <span>Message to sign</span>
          <textarea
            value={message}
            disabled={signing.isPending}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <Actions>
          <button
            type="button"
            disabled={!connection?.messageSigner || signing.isPending}
            onClick={() => void sign()}
          >
            {signing.isPending && <Spinner />}
            {signing.isPending ? "Signing…" : "Sign message"}
          </button>
        </Actions>
        <Failure error={signError} />
        {signedHex && (
          <>
            <label className="field">
              <span>Signature (hexadecimal)</span>
              <textarea readOnly value={signedHex} />
              <small>
                64 bytes encoded as 128 hex characters, for the last submitted
                message.
              </small>
            </label>
            <Actions>
              <button
                type="button"
                className="secondary"
                onClick={() => void copySignature()}
              >
                Copy signature
              </button>
            </Actions>
            <p role="status">
              {copyStatus ||
                "Signed. Verification fields are filled; click Verify signature to check them."}
            </p>
          </>
        )}
      </fieldset>
      <fieldset className="lesson-step" disabled={signing.isPending}>
        <legend>Verify separately</legend>
        <p>
          Use the filled values or paste another message, public key and SEP-53
          signature. Changing a field clears the previous result.
        </p>
        <label className="field">
          <span>Message to verify</span>
          <textarea
            value={verificationMessage}
            onChange={(event) => {
              setVerificationMessage(event.target.value);
              setVerification(undefined);
              setVerifyError(undefined);
            }}
          />
        </label>
        <Field
          label="Signer public key"
          placeholder="G…"
          value={verificationKey}
          onChange={(event) => {
            setVerificationKey(event.target.value);
            setVerification(undefined);
            setVerifyError(undefined);
          }}
        />
        <label className="field">
          <span>Signature to verify (hexadecimal)</span>
          <textarea
            value={verificationHex}
            onChange={(event) => {
              setVerificationHex(event.target.value);
              setVerification(undefined);
              setVerifyError(undefined);
            }}
          />
        </label>
        <Actions>
          <button
            type="button"
            disabled={!verificationKey.trim() || !verificationHex.trim()}
            onClick={verify}
          >
            Verify signature
          </button>
        </Actions>
        <Failure error={verifyError} />
        <p role="status">
          {verification === undefined
            ? "Not verified yet."
            : verification
            ? "Valid signature for this message and public key."
            : "Invalid signature: the message, public key and signature do not match."}
        </p>
      </fieldset>
    </>
  );
}

// Request the message capability specifically. The selector can reject a
// wallet that signs transactions but cannot produce SEP-53 signatures, and
// changing the source remounts the form so old results are cleared.
export default function Message() {
  return (
    <SignerProvider capability="message">
      <MessageExample />
    </SignerProvider>
  );
}
