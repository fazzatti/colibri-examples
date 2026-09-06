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
const wasm = await Deno.readFile(
  new URL("./contract/token.wasm", import.meta.url),
);

const deployment = new Contract({
  networkConfig,
  contractConfig: { wasm },
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

const tokenName = await token.name();

const decimals = await token.decimals();

console.log("Token:", tokenName, "decimals:", decimals);

// The approval expires at a ledger number, not a wall-clock timestamp.
const rpc = new Server(networkConfig.rpcUrl);

const latest = await rpc.getLatestLedger();

const allowanceExpiration = latest.sequence + 100;

// SEP-41 uses integers in the token's smallest unit. Here decimals() is 7.
// Owner authorizes a 10-token allowance, expiring at a specific ledger.
await token.approve({
  from: owner.publicKey(),
  spender: spender.publicKey(),
  amount: 10_0000000n,
  liveUntilLedger: allowanceExpiration,
  config: ownerConfig,
});

const allowanceBefore = await token.allowance({
  from: owner.publicKey(),
  spender: spender.publicKey(),
});

console.log("Allowance before:", allowanceBefore);

// Spender, not owner, signs the transferFrom call. The contract validates the
// allowance and reduces it by the 3 tokens transferred to recipient.
await token.transferFrom({
  spender: spender.publicKey(),
  from: owner.publicKey(),
  to: recipient.publicKey(),
  amount: 3_0000000n,
  config: spenderConfig,
});

// Compare the remaining spending permission with the actual received balance.
const allowanceAfter = await token.allowance({
  from: owner.publicKey(),
  spender: spender.publicKey(),
});

const recipientBalance = await token.balance({ id: recipient.publicKey() });

console.log("Allowance after:", allowanceAfter);
console.log("Recipient's smallest-unit balance:", recipientBalance);
