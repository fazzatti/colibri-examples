import {
  createClassicTransactionPipeline,
  initializeWithFriendbot,
  LocalSigner,
  NativeAccount,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import {
  ChannelAccounts,
  createChannelAccountsPlugin,
} from "@colibri/plugin-channel-accounts";
import { Asset, Operation } from "stellar-sdk";

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

// Two channels provide two independent sequence numbers. They do not own the
// payment funds: keep the payment's OPERATION source explicitly set to sender.
const sponsor = NativeAccount.fromMasterSigner(sender);

const channels = await ChannelAccounts.open({
  numberOfChannels: 2,
  sponsor,
  networkConfig,
  config: senderConfig,
});

// Closing channels must happen after every in-flight payment has settled,
// even if one of them failed. This try/finally exists only for that cleanup.
try {
  // open() sponsors the accounts' RESERVES, but creates them with zero XLM.
  // With no fee-bump sponsor in this lesson, fund their transaction fees.
  const fundChannelFees = createClassicTransactionPipeline({ networkConfig });

  await fundChannelFees({
    operations: channels.map((channel) =>
      Operation.payment({
        destination: channel.address(),
        asset: Asset.native(),
        amount: "1",
      })
    ),
    config: senderConfig,
  });

  const sendPayment = createClassicTransactionPipeline({ networkConfig });

  sendPayment.use(createChannelAccountsPlugin({ channels }));

  // The small loop is intentional: it demonstrates concurrent submissions
  // sharing the same business account, without fee bumps or muxed addresses.
  // There is no global Promise.all retry: resubmitting blindly can double-pay.
  // allSettled waits for ALL submissions, including when one rejects. That is
  // necessary before the finally block merges the channel accounts.
  const paymentRequests = [1, 2, 3, 4].map(() =>
    sendPayment({
      operations: [Operation.payment({
        source: sender.publicKey(),
        destination: recipient.publicKey(),
        asset: Asset.native(),
        amount: "1",
      })],
      config: senderConfig,
    })
  );

  const results = await Promise.allSettled(paymentRequests);

  // Report each settled result, and propagate any rejected submission.
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;

    console.log("Confirmed payment:", result.value.hash);
  }
} finally {
  await ChannelAccounts.close({
    channels,
    sponsor,
    networkConfig,
    config: senderConfig,
  });
}
