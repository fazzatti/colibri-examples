/**
 * CAP-40: submitting transaction D discloses the signature needed for C.
 * C and D are separate transactions, not an atomic two-transaction payment.
 */
import {
  buildTransaction,
  createClassicTransactionPipeline,
  Ed25519SignedPayloadSigner,
  initializeWithFriendbot,
  LocalSigner,
  NetworkConfig,
  sendTransaction,
  type TransactionConfig,
} from "@colibri/core";
import {
  Asset,
  Keypair,
  Operation,
  Transaction,
  TransactionBuilder,
  xdr,
} from "stellar-sdk";
import { Server } from "stellar-sdk/rpc";

// Testnet accounts are disposable. Friendbot funds them and waits for RPC visibility.
const networkConfig = NetworkConfig.TestNet();
using alice = LocalSigner.generateRandom();
using bob = LocalSigner.generateRandom();

for (const signer of [alice, bob]) {
  await initializeWithFriendbot(
    networkConfig.friendbotUrl,
    signer.publicKey(),
    {
      rpcUrl: networkConfig.rpcUrl,
      allowHttp: networkConfig.allowHttp,
    },
  );
}

const aliceConfig: TransactionConfig = {
  source: alice.publicKey(),
  signers: [alice],
  fee: { base: "100" },
  timeout: 120,
};

const rpc = new Server(networkConfig.rpcUrl);

// 1. Agree on C: Bob pays Alice 2 XLM. Freeze every hash-affecting field now.
// Bob's next sequence is unused. D uses Alice's sequence, not Bob's.
const bobState = await rpc.getAccount(bob.publicKey());

// Disclosure is not a trustless exchange protocol. C can still fail if Bob
// spends its balance/sequence or C expires. Real protocols need additional
// account-state and timing constraints; never infer atomicity from this demo.
const transactionC = await buildTransaction({
  source: bob.publicKey(),
  sequence: bobState.sequenceNumber(),
  networkPassphrase: networkConfig.networkPassphrase,
  baseFee: "100",
  preconditions: { timeoutSeconds: 300 },
  operations: [
    Operation.payment({
      destination: alice.publicKey(),
      asset: Asset.native(),
      amount: "2",
    }),
  ],
});

// 2. A P key means "Bob's signature over exactly these payload bytes".
// Here they are hash(C), so the same signature can later authorize C.
const discloseSignatureForC = Ed25519SignedPayloadSigner.forTransaction({
  signer: bob,
  transaction: transactionC,
});

console.log(
  "Public P key containing Bob and hash(C):",
  discloseSignatureForC.signerKey(),
);

// 3. D pays Bob 1 XLM, but also requires the payload signature.
// Alice signs D normally. Bob supplies the extra signature over hash(C).
// The P key is NOT installed on an account: there is no persistent grant.
const sendDisclosurePayment = createClassicTransactionPipeline({
  networkConfig,
  rpc,
});

const transactionD = await sendDisclosurePayment({
  operations: [
    Operation.payment({
      destination: bob.publicKey(),
      asset: Asset.native(),
      amount: "1",
    }),
  ],
  config: {
    ...aliceConfig,
    extraSigners: [discloseSignatureForC.signerKey()],
    signers: [alice, discloseSignatureForC],
  },
});

console.log("D confirmed:", transactionD.hash);

// 4. Read the confirmed envelope. Do not sign C again using Bob's local key:
// the point is recovering the signature that D made public.
const confirmedEnvelopeD = transactionD.response.envelopeXdr.toXdr("base64");
const confirmedD = TransactionBuilder.fromXdr(
  confirmedEnvelopeD,
  networkConfig.networkPassphrase,
);

if (!(confirmedD instanceof Transaction)) {
  throw new Error("Expected an ordinary transaction D");
}

const bobVerifier = Keypair.fromPublicKey(bob.publicKey());

// Locate the published signature that verifies against the frozen hash of C.
const transactionCHash = transactionC.hash();
const disclosed = confirmedD.signatures.find((decorated) =>
  bobVerifier.verify(transactionCHash, decorated.signature)
);

if (!disclosed) throw new Error("D did not disclose Bob's signature over C");

// 5. A P-key signature has a different hint from a G-key signature.
// Preserve the signature bytes and replace only the four-byte lookup hint.
const signatureForC = new xdr.DecoratedSignature({
  hint: bobVerifier.signatureHint(),
  signature: disclosed.signature,
});

transactionC.addDecoratedSignature(signatureForC);

const resultC = await sendTransaction({ transaction: transactionC, rpc });

console.log("C confirmed using D's disclosed signature:", resultC.hash);
