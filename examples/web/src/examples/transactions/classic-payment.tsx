import { useState } from "react";
import { Asset, Operation } from "@stellar/stellar-sdk";
import { useWallet } from "@colibri/react/wallet";
import { useClassicTransaction } from "@colibri/react/transactions/classic";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import {
  Actions,
  Field,
  MutationState,
  Note,
  Value,
} from "../../components/lesson.tsx";

export default function ClassicPayment() {
  const wallet = useWallet();
  const payment = useClassicTransaction();
  const [destination, setDestination] = useState(exampleAccount);
  const source = accountId(wallet.address ?? "");
  const recipient = accountId(destination);

  function send() {
    if (!source || !recipient) return;

    // A Classic payment needs an existing recipient. Amount is a decimal string
    // in XLM, while fee is expressed in stroops (1 XLM = 10,000,000 stroops).
    const operation = Operation.payment({
      destination: recipient,
      asset: Asset.native(),
      amount: "1",
    });
    payment.mutate({
      operations: [operation],
      config: { source, signers: [...wallet.signers], fee: "100", timeout: 60 },
    });
  }

  return (
    <>
      <Note>
        Connect and fund a Testnet wallet first. This button requests a
        signature and sends exactly 1 XLM to an existing Testnet account.
        Colibri's Classic pipeline builds, signs and submits the operation.
      </Note>
      <Value label="Source">{source ?? "Connect a wallet first"}</Value>
      <Field
        label="Recipient G-address"
        value={destination}
        placeholder="G…"
        onChange={(event) => setDestination(event.target.value.trim())}
      />
      <Actions>
        <button
          type="button"
          disabled={!source || !recipient || !wallet.signers.length ||
            payment.isPending}
          onClick={send}
        >
          Send 1 Testnet XLM
        </button>
      </Actions>
      <MutationState mutation={payment} />
      {payment.data && (
        <a href={`#transaction?hash=${payment.data.hash}`}>
          Inspect the confirmed transaction →
        </a>
      )}
      <p className="muted">
        Pending covers the whole pipeline. On an ambiguous error, inspect the
        account/transaction before retrying; mutations never retry
        automatically.
      </p>
    </>
  );
}
