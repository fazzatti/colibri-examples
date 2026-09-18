import { useState } from "react";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { useConnect, useConnection } from "@colibri/react";
import { useSignMessage } from "@colibri/react/signers";
import {
  Actions,
  Failure,
  Field,
  Note,
  Spinner,
  Value,
} from "../../components/lesson.tsx";

export default function Message() {
  const connect = useConnect();
  const { connection, connectorId, status } = useConnection();
  const signing = useSignMessage();
  const [message, setMessage] = useState("Approve document revision 42.");
  const [signedHex, setSignedHex] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationKey, setVerificationKey] = useState("");
  const [verificationHex, setVerificationHex] = useState("");
  const [verification, setVerification] = useState<boolean>();
  const [signError, setSignError] = useState<unknown>();
  const [verifyError, setVerifyError] = useState<unknown>();
  const [copyStatus, setCopyStatus] = useState("");

  async function createIdentity() {
    setSignError(undefined);
    setSignedHex("");
    setCopyStatus("");
    signing.reset();
    try {
      await connect("practice-identity");
    } catch (cause) {
      setSignError(cause);
    }
  }

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
        This lesson uses a disposable practice identity. Creating it replaces
        the current connection; its secret stays in memory and is lost on
        disconnect or reload. Signing and verification do not need funding or
        submit a transaction.
      </Note>
      <fieldset className="lesson-step">
        <legend>1. Choose the signing identity</legend>
        <p>
          Create an identity with the messageSigner capability required by
          useSignMessage.
        </p>
        <Actions>
          <button
            type="button"
            className="secondary"
            disabled={status === "connecting" || signing.isPending}
            onClick={() => void createIdentity()}
          >
            Create practice identity
          </button>
        </Actions>
        <Value label="Signing identity">
          {connectorId === "practice-identity"
            ? connection?.address
            : "Create a practice identity first"}
        </Value>
      </fieldset>
      <fieldset className="lesson-step">
        <legend>2. Sign the message</legend>
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
            disabled={connectorId !== "practice-identity" ||
              !connection?.messageSigner || signing.isPending}
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
        <legend>3. Verify separately</legend>
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
