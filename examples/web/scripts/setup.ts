import { Asset, Operation } from "@stellar/stellar-sdk";
import {
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  type TransactionConfig,
} from "@colibri/core";
import { createClassicTransactionPipeline } from "@colibri/core/classic-transaction";
import { Counter } from "../src/generated/counter/index.ts";

// These disposable accounts and all operations exist only on Testnet.
// Secrets live in this process and are destroyed on exit; output is public.
const networkConfig = NetworkConfig.TestNet();
using holder = LocalSigner.generateRandom(true);
using issuer = LocalSigner.generateRandom(true);
for (const signer of [holder, issuer]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    { rpcUrl: networkConfig.rpcUrl },
  );
}

// Prepare a Classic asset and trustline for the balance lessons. A payment
// from the issuer creates 25 GUIDE; it is a distinct asset, not native XLM.
const asset = new Asset("GUIDE", issuer.publicKey());
const transact = createClassicTransactionPipeline({ networkConfig });
await transact({
  operations: [
    Operation.changeTrust({ asset, limit: "1000" }),
    Operation.payment({
      source: issuer.publicKey(),
      destination: holder.publicKey(),
      asset,
      amount: "25",
    }),
  ],
  config: {
    source: holder.publicKey(),
    signers: [holder, issuer],
    fee: "100",
    timeout: 120,
  },
});

// Upload the existing reviewed counter Wasm and deploy a fresh instance.
// Bindings were generated locally; this step creates the actual ledger state.
const wasm = await Deno.readFile(
  new URL("../../contract-bindings/contract/counter.wasm", import.meta.url),
);
const counter = new Counter({ networkConfig, contractConfig: { wasm } });
const config: TransactionConfig = {
  source: holder.publicKey(),
  signers: [holder],
  fee: { base: "100" },
  timeout: 120,
};
await counter.uploadWasm(config);
await counter.deploy({ config });

// Vite exposes VITE_ values to the browser. Preserve unrelated settings when
// refreshing these public fixture identifiers after a reset.
const environmentPath = new URL("../.env.local", import.meta.url);
let previous = "";
try {
  previous = await Deno.readTextFile(environmentPath);
} catch (cause) {
  if (!(cause instanceof Deno.errors.NotFound)) throw cause;
}
const retained = previous.split("\n").filter((line) =>
  !/^VITE_EXAMPLE_(ACCOUNT|ISSUER|COUNTER)=/.test(line)
).join("\n").trimEnd();
const environment = [
  `VITE_EXAMPLE_ACCOUNT=${holder.publicKey()}`,
  `VITE_EXAMPLE_ISSUER=${issuer.publicKey()}`,
  `VITE_EXAMPLE_COUNTER=${counter.getContractId()}`,
].join("\n") + "\n";
await Deno.writeTextFile(
  environmentPath,
  (retained ? `${retained}\n` : "") + environment,
);
console.log(environment);
console.log(
  "Testnet fixtures ready. Start/reload deno task web. Rerun setup after a Testnet reset or when the counter reaches 100.",
);
