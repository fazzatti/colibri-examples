import {
  Contract,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  SEP41TokenContract,
  type TransactionConfig,
} from "@colibri/core";
import { Server } from "stellar-sdk/rpc";
// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using owner = LocalSigner.generateRandom();
using spender = LocalSigner.generateRandom();
using recipient = LocalSigner.generateRandom();
for (const signer of [owner, spender, recipient]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}
const ownerConfig: TransactionConfig = {
  source: owner.publicKey(),
  signers: [owner],
  fee: { base: "100" },
  timeout: 120,
};
const spenderConfig: TransactionConfig = {
  source: spender.publicKey(),
  signers: [spender],
  fee: { base: "100" },
  timeout: 120,
};

// Upload stores code once; deploying creates an instance and invokes this
// fixture's constructor. Neither step is part of the SEP-41 token interface.
const deployment = new Contract({
  networkConfig,
  contractConfig: {
    wasm: await Deno.readFile(
      new URL("./contract/token.wasm", import.meta.url),
    ),
  },
});
await deployment.loadSpecFromWasm();
await deployment.uploadWasm(ownerConfig);
await deployment.deploy({
  constructorArgs: { recipient: owner.publicKey() },
  config: ownerConfig,
});

// The constructor mints 100 units to owner. Mint is NOT part of SEP-41;
// the specialized client exposes the standard interface of an arbitrary token.
const token = new SEP41TokenContract({
  networkConfig,
  contractId: deployment.getContractId(),
});
console.log("Token:", await token.name(), "decimals:", await token.decimals());
const latest = await new Server(networkConfig.rpcUrl).getLatestLedger();

// SEP-41 uses integers in the token's smallest unit. Here decimals() is 7.
// Owner authorizes a 10-token allowance, expiring at a specific ledger.
await token.approve({
  from: owner.publicKey(),
  spender: spender.publicKey(),
  amount: 10_0000000n,
  liveUntilLedger: latest.sequence + 100,
  config: ownerConfig,
});
console.log(
  "Allowance before:",
  await token.allowance({
    from: owner.publicKey(),
    spender: spender.publicKey(),
  }),
);

// Spender, not owner, signs the transferFrom call. The contract validates the
// allowance and reduces it by the 3 tokens transferred to recipient.
await token.transferFrom({
  spender: spender.publicKey(),
  from: owner.publicKey(),
  to: recipient.publicKey(),
  amount: 3_0000000n,
  config: spenderConfig,
});
console.log(
  "Allowance after:",
  await token.allowance({
    from: owner.publicKey(),
    spender: spender.publicKey(),
  }),
);
console.log(
  "Recipient's smallest-unit balance:",
  await token.balance({ id: recipient.publicKey() }),
);
