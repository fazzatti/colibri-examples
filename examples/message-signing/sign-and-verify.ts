/**
 * Sign a SEP-53 message and verify it using only a public key.
 * Run: deno task message
 */
import { LocalSigner } from "@colibri/core";
import { Keypair } from "stellar-sdk";

/**
 * No Friendbot or RPC: a key can sign a message without an on-chain account.
 * 'using' disposes the secret handle when this module finishes.
 */
using signer = LocalSigner.generateRandom();
const message = "Colibri example: I approve document revision 42.";

/**
 * signMessage uses SEP-53 domain separation. It is not the raw sign(bytes)
 * primitive, a transaction signature, or a P-address signed-payload signer.
 *
 * Keep the message, signature and public key together for verification.
 * A valid signature only proves control of that key over those bytes.
 * For a login protocol, use WebAuth or explicitly define and validate an
 * audience, nonce, expiry and replay policy; this example is not a login flow.
 */
const signature = signer.signMessage(message);

// Verification uses only the public key; it does not need the signer secret.
const verifier = Keypair.fromPublicKey(signer.publicKey());
const originalIsValid = verifier.verifyMessage(message, signature);

// Keep the signature unchanged while changing the message to demonstrate binding.
const changedMessage = message + " changed";
const changedIsValid = verifier.verifyMessage(changedMessage, signature);

console.log("Public key:", signer.publicKey());
console.log("Original message verifies:", originalIsValid);
console.log("Changed message verifies:", changedIsValid);
