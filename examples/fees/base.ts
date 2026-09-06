import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { Asset, Operation, TransactionBuilder } from "stellar-sdk";

// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using sender = LocalSigner.generateRandom();
using recipient = LocalSigner.generateRandom();

for (const signer of [sender, recipient]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}

const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: { base: "100" },
  timeout: 120,
};

// Both operations are in ONE transaction. 100 stroops per operation means a 200-stroop envelope bid.
// Confirmed feeCharged can be lower than that bid when there is no congestion.
const sendTwoPayments = createClassicTransactionPipeline({ networkConfig });

const result = await sendTwoPayments({
  operations: [
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
    Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: "2",
    }),
  ],
  config: { ...senderConfig, fee: { base: "100" } },
});

// Decode the envelope returned by RPC after confirmation. Its fee is the bid;
// the transaction result reports what the network actually charged.
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const confirmed = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

console.log("Confirmed envelope fee bid:", confirmed.fee, "stroops");
console.log("Actually charged:", result.feeCharged, "stroops");
console.log("Transaction:", result.hash);
