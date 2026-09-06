import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
  type TransactionConfig,
} from "@colibri/core";
import { TransactionBuilder } from "stellar-sdk";
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

// The XLM Stellar Asset Contract invokes Soroban, unlike a native payment.
// Its total fee includes simulated resources AND an inclusion bid.
const xlm = StellarAssetContract.NativeXLM(networkConfig);
const result = await xlm.transfer({
  from: sender.publicKey(),
  to: recipient.publicKey(),
  amount: 1_0000000n,
  config: { ...senderConfig, fee: { max: "1000000" } },
});

// Colibri subtracts resource fees from the cap and uses the remainder as the
// inclusion bid. This is a total bid budget, not a cheap-fee estimator.
// If resources leave less than the protocol minimum inclusion, it rejects.
const confirmed = TransactionBuilder.fromXdr(
  result.response.envelopeXdr.toXdr("base64"),
  networkConfig.networkPassphrase,
);
console.log("Confirmed total fee bid:", confirmed.fee, "stroops");
console.log("Actual charge:", result.response.resultXdr.feeCharged);
console.log("Transfer:", result.hash);
