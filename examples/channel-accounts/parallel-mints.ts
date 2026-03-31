/**
 * Example: Channel accounts + fee bumps with muxed addresses on TestNet
 *
 * This example shows how to:
 * 1. fund a sponsor and a sender on TestNet with Friendbot
 * 2. generate muxed addresses from the sender's base account
 * 3. open a pool of channel accounts
 * 4. send 30 XLM payments through the Stellar Asset Contract
 * 5. wrap each payment in a fee bump paid by the sponsor account
 *
 * Run with: deno task parallel-mints
 */
import {
  initializeWithFriendbot,
  LocalSigner,
  NativeAccount,
  NetworkConfig,
  StellarAssetContract,
} from "@colibri/core";
import {
  ChannelAccounts,
  createChannelAccountsPlugin,
} from "@colibri/plugin-channel-accounts";
import { createFeeBumpPlugin } from "@colibri/plugin-fee-bump";
import chalk from "chalk";

console.log(
  chalk.bgBlue(
    "Starting channel accounts + muxed addresses example on TestNet...",
  ),
);

/**
 * We begin by selecting Colibri's built-in TestNet configuration.
 *
 * This gives us the public RPC and Friendbot endpoints needed for the example.
 */
const networkConfig = NetworkConfig.TestNet();
const baseFee = "100000";
const timeout = 30;
const numberOfChannels = 5;
const numberOfTransactions = 30;

/**
 * This example uses:
 * - one sponsor account to open the channel accounts and pay the fee bumps
 * - one sender account that signs the actual XLM payments
 *
 * The receiver is always the same base account as the sender, but encoded as a
 * different muxed address for each transaction.
 */
const sponsorSigner = LocalSigner.generateRandom();
const senderSigner = LocalSigner.generateRandom();

/**
 * Before these accounts can interact with TestNet, they need test XLM.
 *
 * Friendbot is the public service that creates and funds new TestNet accounts.
 */
console.log("Funding sponsor with Friendbot...");
await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  sponsorSigner.publicKey(),
);

console.log("Funding sender with Friendbot...");
await initializeWithFriendbot(
  networkConfig.friendbotUrl,
  senderSigner.publicKey(),
);

/**
 * The sponsor and sender are represented as NativeAccount instances so we can
 * use helpers such as `address()` and `muxedAddress()`.
 */
const sponsor = NativeAccount.fromMasterSigner(sponsorSigner);
const sender = NativeAccount.fromMasterSigner(senderSigner);
const XLM = StellarAssetContract.NativeXLM(networkConfig);

console.log("Sender base address:", chalk.green(sender.address()));
console.log(
  "Example muxed receiver:",
  chalk.green(sender.muxedAddress("1")),
);
/**
 * We open five channel accounts and reuse them across thirty transactions.
 *
 * The channel pool lets us keep several transactions in flight without
 * fighting over the same sequence number.
 */
console.log(`Opening ${numberOfChannels} channel accounts...`);
const channels = await ChannelAccounts.open({
  numberOfChannels,
  sponsor,
  networkConfig,
  config: {
    source: sponsor.address(),
    fee: baseFee,
    timeout,
    signers: [sponsor.signer()],
  },
});

/**
 * The channel-accounts plugin rotates the inner transaction source account.
 *
 * By attaching it to the SAC invoke pipeline, every `XLM.transfer(...)`
 * call can borrow one of the channel accounts automatically.
 */
XLM.contract.invokePipe.use(createChannelAccountsPlugin({ channels }));

/**
 * The fee-bump plugin wraps each SAC transfer in an outer fee-bump
 * transaction paid by the sponsor account.
 *
 * The outer fee is higher than the regular base fee because the fee-bump
 * envelope must cover the wrapped transaction as well.
 */
XLM.contract.invokePipe.use(
  createFeeBumpPlugin({
    networkConfig,
    feeBumpConfig: {
      source: sponsor.address(),
      fee: "10000000",
      signers: [sponsor.signer()],
    },
  }),
);

/**
 * Now we trigger all thirty SAC transfers without waiting for each one
 * individually.
 *
 * Each transfer sends 1 XLM from the sender's raw `G...` address to one of its
 * own muxed `M...` addresses. The muxed id is simply the receiver number.
 *
 * The `.then(...)` logs appear as the network confirms each transaction.
 */
console.log(
  `Submitting ${numberOfTransactions} self-payments with ${numberOfChannels} channels...`,
);

const paymentPromises = [];

for (let index = 0; index < numberOfTransactions; index++) {
  const receiverNumber = index + 1;
  const receiver = sender.muxedAddress(`${receiverNumber}`);

  const paymentPromise = XLM.transfer({
    from: sender.address(),
    to: receiver,
    amount: 1_0000000n,
    config: {
      source: sender.address(),
      fee: baseFee,
      signers: [sender.signer()],
      timeout,
    },
  })
    .then((result) => {
      console.log(`Receiver ${receiverNumber}: ${chalk.green(receiver)}`);
      console.log(`  Hash: ${chalk.green(result.hash)}`);

      return result;
    })
    .catch((error) => {
      console.error(`Receiver ${receiverNumber} failed.`);
      throw error;
    });

  paymentPromises.push(paymentPromise);
}

const settledPayments = await Promise.allSettled(paymentPromises);

/**
 * After all transfer promises settle, we close the channel accounts so their
 * balances are merged back into the sponsor account.
 */
console.log("Closing channel accounts...");
await ChannelAccounts.close({
  channels,
  sponsor,
  networkConfig,
  config: {
    source: sponsor.address(),
    fee: baseFee,
    timeout,
    signers: [sponsor.signer()],
  },
});

const failedPayments = settledPayments.filter((result) =>
  result.status === "rejected"
);

if (failedPayments.length > 0) {
  throw new Error(`${failedPayments.length} payment(s) failed.`);
}
