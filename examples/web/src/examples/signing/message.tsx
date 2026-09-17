import { useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { useConnect, useConnection } from "@colibri/react";
import { useSignMessage } from "@colibri/react/signers";
import {
  Actions,
  Failure,
  Field,
  MutationState,
  Note,
  Value,
} from "../../components/lesson.tsx";

export default function Message() {
  const connect = useConnect();
  const { connection, connectorId, status } = useConnection();
  const signing = useSignMessage();
  const [message, setMessage] = useState(
    "Hello from the Colibri Testnet field guide.",
  );
  const [verification, setVerification] = useState<boolean>();
  const [error, setError] = useState<unknown>();

  async function createIdentity() {
    setError(undefined);
    setVerification(undefined);
    signing.reset();
    try {
      await connect("practice-identity");
    } catch (cause) {
      setError(cause);
    }
  }
  async function sign() {
    if (!connection) return;
    setError(undefined);
    setVerification(undefined);
    try {
      // SEP-53 domain-separates the message. It is not a transaction signature.
      // Verify the exact submitted message, not the possibly edited input later.
      const submittedMessage = message;
      const publicKey = connection.address;
      const signature = await signing.mutateAsync(submittedMessage);
      setVerification(
        Keypair.fromPublicKey(publicKey).verifyMessage(
          submittedMessage,
          signature,
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <>
      <Note>
        This lesson switches to an explicitly created, disposable identity. Its
        secret stays in memory and is lost on disconnect/reload. The signature
        is real; no ledger transaction or funding is involved. Kit message
        capabilities are not assumed.
      </Note>
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
        {connection?.address ?? "Create an identity first"}
      </Value>
      <Field
        label="Message"
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setVerification(undefined);
        }}
      />
      <Actions>
        <button
          type="button"
          disabled={connectorId !== "practice-identity" ||
            !connection?.messageSigner || signing.isPending}
          onClick={() => void sign()}
        >
          Sign & verify message
        </button>
      </Actions>
      <Failure error={error} />
      <MutationState mutation={signing} />
      {verification !== undefined && (
        <Value label="Signature for submitted message">
          {verification ? "Verified" : "Invalid"}
        </Value>
      )}
    </>
  );
}
