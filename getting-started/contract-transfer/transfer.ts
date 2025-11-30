/**
 * Getting Started Example: Contract Transfer
 * 
 * This example demonstrates how to perform a simple transfer
 * of 50 XLM from one account to another on TestNet
 * using the Stellar Asset Contract (SAC) helper.
 * 

 */
import {
  NetworkConfig,
  LocalSigner,
  StellarAssetContract,
  initializeWithFriendbot,
} from "@colibri/core";
import chalk from "chalk";

console.log(
  chalk.bgBlue(`Starting Getting started -> Contract Transfer example...`)
);

/**
 * We begin by selecting a preset NetworkConfig for TestNet.
 * This configuration includes the necessary RPC and Friendbot URLs
 * publicly available for TestNet and provided by SDF.
 *
 * This configuration object can be used within the Colibri SDK
 * as a standardized way of sharing predefined network setups. One
 * can leverage the existing setups provided by the SDK as well as
 * define their own custom configurations.
 */
const networkConfig = NetworkConfig.TestNet();

/**
 * Next, we generate two new random keypairs
 * to act as the sender and receiver of the XLM transfer.
 *
 * For this we use the LocalSigner utility, which
 * allows us to create keypairs and sign transactions locally.
 */
const sender = LocalSigner.generateRandom();
const receiver = LocalSigner.generateRandom();
console.log("Sender Public Key:", chalk.green(sender.publicKey()));
console.log("Receiver Public Key:", chalk.green(receiver.publicKey()));

/**
 * In order to interact with the network, these accounts first need
 * to be initialized and funded with TestNet XLM.
 *
 * For this, we use the Friendbot service provided by SDF, which
 * funds new accounts with TestNet XLM for development and testing purposes.
 */
await initializeWithFriendbot(networkConfig.friendbotUrl, sender.publicKey());
console.log("Sender Account funded!");

await initializeWithFriendbot(networkConfig.friendbotUrl, receiver.publicKey());
console.log("Receiver Account funded!");

/**
 * Now that both accounts are funded, we can proceed to perform
 * the XLM transfer using the Stellar Asset Contract (SAC) client.
 *
 * This tool provides a high-level abstraction for interacting with
 * Stellar Assets through their SAC smart contracts. This client
 * provides core functionality as well a the standardized interface
 * defined by the SAC specification.
 *
 * Here, we create an instance of the SAC client for the native XLM asset.
 */
const XLM = StellarAssetContract.NativeXLM(networkConfig);

/**
 * Before we perform the transfer, let's check the receiver's
 * current XLM balance reading the balance from the SAC contract
 * by invoking the `balance` method.
 */
const receiverBalanceBefore = await XLM.balance({
  id: receiver.publicKey(),
});
console.log(
  `Receiver balance before transfer: ${chalk.green(
    receiverBalanceBefore
  )} stroops`
);

/**
 * Now we can perform the transfer of 50 XLM from the sender
 * to the receiver by invoking the `transfer` method of the SAC client.
 *
 * We provide the necessary parameters required by the SAC specification,
 * including the `from`, `to`, and `amount` fields.
 *
 * We also add a TransactionConfig object to specify additional
 * transaction configuration such as:
 *
 * - source account: the account that will pay for the transaction fees.
 * In this case, the sender will cover the fees for this transfer.
 *
 * - fee: the maximum inclusion fee the sender is  willing to pay
 * for the transaction (in stroops).
 *
 * - signers: an array of signers that will sign the transaction
 * to authorize the transfer. Here since the sender is the one
 * sending the funds and also the source of the transaction, we only
 * need the sender to sign the transaction.
 *
 * - timeout: the maximum time (in seconds) to wait for the transaction
 * to be included in a ledger before considering it failed. If the
 * transaction is not confirmed  within this time frame, it will be
 * rendered invalid.
 */
const result = await XLM.transfer({
  from: sender.publicKey(),
  to: receiver.publicKey(),
  amount: 50_0000000n, // amount in stroops (50 XLM)
  config: {
    source: sender.publicKey(),
    fee: "100000", // 0.01 XLM
    signers: [sender],
    timeout: 30,
  },
});

console.log("Initial transfer of 50 XLM completed!");

/**
 * Finally, let's check the receiver's XLM balance again
 * to confirm that the transfer was successful.
 */

const receiverBalanceAfter = await XLM.balance({
  id: receiver.publicKey(),
});
console.log(
  `Receiver balance after transfer: ${chalk.green(
    receiverBalanceAfter
  )} stroops`
);

console.log("✅ Transaction successful!");
console.log("   Hash:", chalk.green(result.hash));
