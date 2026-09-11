/**
 * Example: Soroban Total Fee Cap
 *
 * Transfer 1 XLM through its Stellar Asset Contract with a total fee budget.
 * Simulation determines resource fees, and Colibri uses the remainder of the
 * cap as the inclusion bid.
 *
 * Run: deno task max
 */
import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  StellarAssetContract,
  type TransactionConfig,
} from "@colibri/core";
import { TransactionBuilder } from "stellar-sdk";

/**
 * Fund a sender and recipient on Testnet. This transfer invokes the XLM
 * Stellar Asset Contract, so the transaction needs simulated Soroban
 * resources as well as an inclusion fee.
 */
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

/**
 * The transaction configuration names its source account and the signers
 * allowed to satisfy its requirements. base is an inclusion bid per
 * operation in stroops; Soroban simulation adds resource fees when needed.
 * timeout sets transaction validity in seconds, not an RPC request deadline.
 */
const senderConfig: TransactionConfig = {
  source: sender.publicKey(),
  signers: [sender],
  fee: { base: "100" },
  timeout: 120,
};

/**
 * The XLM Stellar Asset Contract invokes Soroban, unlike a native payment.
 * Its total fee includes simulated resources AND an inclusion bid.
 */
const xlm = StellarAssetContract.NativeXLM(networkConfig);

/**
 * Colibri subtracts resource fees from the cap and uses the remainder as the
 * inclusion bid. This is a total bid budget, not a cheap-fee estimator. If
 * resources leave less than the protocol minimum inclusion, it rejects.
 */
const result = await xlm.transfer({
  from: sender.publicKey(),
  to: recipient.publicKey(),
  amount: 1_0000000n,
  config: { ...senderConfig, fee: { max: "1000000" } },
});

/**
 * Decode the envelope returned by RPC after confirmation. Its fee is the
 * bid; the transaction result reports what the network actually charged.
 */
const confirmedEnvelope = result.response.envelopeXdr.toXdr("base64");
const confirmed = TransactionBuilder.fromXdr(
  confirmedEnvelope,
  networkConfig.networkPassphrase,
);

console.log("Confirmed total fee bid:", confirmed.fee, "stroops");
console.log("Actual charge:", result.response.resultXdr.feeCharged);
console.log("Transfer:", result.hash);
