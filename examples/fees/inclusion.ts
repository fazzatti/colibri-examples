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

// Both operations are in ONE transaction. 205 stroops is the exact total inclusion bid, not 205 per operation.
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
  config: { ...senderConfig, fee: { inclusion: "205" } },
});
const confirmed = TransactionBuilder.fromXdr(
  result.response.envelopeXdr.toXdr("base64"),
  networkConfig.networkPassphrase,
);
console.log("Confirmed envelope fee bid:", confirmed.fee, "stroops");
console.log("Actually charged:", result.feeCharged, "stroops");
console.log("Transaction:", result.hash);
