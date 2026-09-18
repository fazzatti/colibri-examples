/**
 * Build and submit a Classic payment of exactly one Testnet XLM.
 *
 * Choose a local signer or connected wallet, and check/fund both the source and
 * recipient on this page. An ordinary payment requires an existing recipient;
 * the optional practice-recipient button creates only a public key until you
 * fund it. Follow Operation.payment into useClassicTransaction, then inspect
 * the confirmed result by hash. The source authorizes the payment and pays the
 * fee. Nothing depends on running another lesson first.
 *
 * @module
 */
import { SignerProvider } from "../../setup/signer-provider.tsx";
import { useState } from "react";
import { LocalSigner } from "@colibri/core";
import { Asset, Operation } from "@stellar/stellar-sdk";
import { useWallet } from "@colibri/react/wallet";
import { useAccount } from "@colibri/react/accounts";
import { TestnetAccountSetup } from "../../components/testnet-account-setup.tsx";
import { useClassicTransaction } from "@colibri/react/transactions/classic";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import {
  Actions,
  Field,
  MutationState,
  Note,
  Value,
} from "../../components/lesson.tsx";

function Payment() {
  const wallet = useWallet();
  const payment = useClassicTransaction();
  const [destination, setDestination] = useState(exampleAccount);
  const source = accountId(wallet.address ?? "");
  const recipient = accountId(destination);

  // Check source and recipient independently. Friendbot creates missing
  // Testnet ledger accounts; the payment below does not include CreateAccount.
  // Both setup panels refetch these queries before submission becomes available.
  const sourceAccount = useAccount(source, { retry: false });
  const recipientAccount = useAccount(recipient, { retry: false });

  function createRecipient() {
    // A payment only needs the recipient's public key. Discard the disposable
    // key immediately, then let the reader create its ledger account below.
    using identity = LocalSigner.generateRandom(true);
    setDestination(identity.publicKey());
  }

  function send() {
    if (
      !source || !recipient || !sourceAccount.isSuccess ||
      !recipientAccount.isSuccess
    ) return;

    // A Classic payment needs an existing recipient. Amount is a decimal string
    // in XLM, while fee is expressed in stroops (1 XLM = 10,000,000 stroops).
    const operation = Operation.payment({
      destination: recipient,
      asset: Asset.native(),
      amount: "1",
    });

    // Pass native operations plus explicit source/signers into the Classic
    // pipeline. It loads the source sequence and builds/signs/submits the
    // transaction; the operation alone is not a signed envelope.
    payment.mutate({
      operations: [operation],
      config: { source, signers: [...wallet.signers], fee: "100", timeout: 60 },
    });
  }

  return (
    <>
      <Note>
        Choose a local signer or wallet above and fund its source. This button
        signs and sends exactly 1 XLM to an existing Testnet account. Colibri's
        Classic pipeline builds, signs and submits the operation.
      </Note>
      <TestnetAccountSetup
        key={source ?? "disconnected"}
        address={source}
        account={sourceAccount}
        label="Transaction source"
      />
      <Value label="Source">{source ?? "Choose a signer above"}</Value>
      <Field
        label="Recipient G-address"
        value={destination}
        placeholder="G…"
        onChange={(event) => setDestination(event.target.value.trim())}
      />
      <Actions>
        <button
          type="button"
          className="secondary"
          disabled={payment.isPending}
          onClick={createRecipient}
        >
          Generate a practice recipient
        </button>
      </Actions>
      <p className="muted">
        Use an existing G-address, or generate a disposable recipient and fund
        it below. Its key is discarded; the Testnet XLM sent to it is only for
        this exercise.
      </p>
      <TestnetAccountSetup
        key={recipient ?? "recipient"}
        address={recipient}
        account={recipientAccount}
        label="Recipient"
      />
      <Actions>
        <button
          type="button"
          disabled={!sourceAccount.isSuccess || !recipientAccount.isSuccess ||
            !wallet.signers.length ||
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

// The selected provider supplies authority for this page only. Local-key
// setup and recipient setup are independent, so another lesson is unnecessary.
export default function ClassicPayment() {
  return (
    <SignerProvider>
      <Payment />
    </SignerProvider>
  );
}
