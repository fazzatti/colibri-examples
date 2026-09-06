/**
 * SEP-45 authenticates a CONTRACT account. Its authorization policy lives in
 * the account contract, so Colibri hands the complete entry to our callback.
 */
import { WebAuthClient } from "@colibri/webauth";
import { buildAuthorizationEntryPreimage, hash, xdr } from "stellar-sdk";
import { deployTestnetContracts } from "./deploy-testnet.ts";

// A software P-256 key simulates an authenticator for this terminal lesson.
// A real browser wallet uses navigator.credentials.get(), origin/RP validation,
// user presence/verification and protected key storage instead.
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["sign", "verify"],
);
const publicKey = new Uint8Array(
  await crypto.subtle.exportKey("raw", keyPair.publicKey),
);

// Only deployment and the local HTTP fixture are setup helpers. All Colibri
// discovery/authentication and account-specific authorization remain here.
const { contractAccount, network, server, close } =
  await deployTestnetContracts(publicKey);
try {
  const client = await WebAuthClient.fromDomain(server.homeDomain, {
    network,
    allowHttp: true, // localhost fixture only; production uses HTTPS
  });
  console.log("Contract account:", contractAccount);

  const jwt = await client.sep45.authenticate({
    account: contractAccount,
    authorize: async (entry, context) => {
      // Bind the assertion to this invocation tree, nonce, network, and expiry.
      // The account's custom __check_auth expects a WebAuthn-shaped assertion.
      const preimage = buildAuthorizationEntryPreimage(
        entry,
        context.validUntilLedgerSeq,
        context.networkPassphrase,
      );
      const challenge = btoa(String.fromCharCode(...hash(preimage.toXdr())))
        .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
      const clientDataJSON = new TextEncoder().encode(JSON.stringify({
        type: "webauthn.get",
        challenge,
        origin: "https://colibri.test",
        crossOrigin: false,
      }));
      const rpIdHash = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("colibri.test"),
        ),
      );
      const authenticatorData = new Uint8Array(37);
      authenticatorData.set(rpIdHash);
      authenticatorData[32] = 0x05; // simulated UP + UV flags; counter stays zero
      const clientDataHash = new Uint8Array(
        await crypto.subtle.digest("SHA-256", clientDataJSON),
      );
      const signedData = new Uint8Array(37 + 32);
      signedData.set(authenticatorData);
      signedData.set(clientDataHash, 37);
      const signature = new Uint8Array(
        await crypto.subtle.sign(
          { name: "ECDSA", hash: "SHA-256" },
          keyPair.privateKey,
          signedData,
        ),
      );

      // Deno WebCrypto returns raw r || s. Soroban requires low-S ECDSA.
      // This is signature encoding, not an extra Colibri authorization policy.
      const order =
        0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
      const s = BigInt(
        "0x" +
          Array.from(
            signature.subarray(32),
            (b) => b.toString(16).padStart(2, "0"),
          ).join(""),
      );
      if (s > order / 2n) {
        let lowS = order - s;
        for (let i = 63; i >= 32; i--) {
          signature[i] = Number(lowS & 255n);
          lowS >>= 8n;
        }
      }

      // SDK 17 XDR objects are immutable. Return a new entry with the complete
      // credential payload; never mutate the original getter-style object.
      if (entry.credentials.type !== "sorobanCredentialsAddress") {
        throw new Error("This passkey example expects address credentials");
      }
      const assertion = xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("authenticator_data"),
          val: xdr.ScVal.scvBytes(authenticatorData),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("client_data_json"),
          val: xdr.ScVal.scvBytes(clientDataJSON),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("signature"),
          val: xdr.ScVal.scvBytes(signature),
        }),
      ]);
      const signedCredentials = new xdr.SorobanAddressCredentials({
        ...entry.credentials.value,
        signatureExpirationLedger: context.validUntilLedgerSeq,
        signature: assertion,
      });
      return new xdr.SorobanAuthorizationEntry({
        rootInvocation: entry.rootInvocation,
        // SEP-45 v0.1.1 uses this legacy credential format. Keep it unchanged.
        credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
          signedCredentials,
        ),
      });
    },
  });
  // Do not print the bearer JWT itself into shared terminal logs.
  console.log("Authenticated:", jwt.protocol, jwt.subject);
  console.log("JWT expires:", jwt.expiresAt?.toISOString());
} finally {
  await close();
}
// The contract is deployed on Testnet; the HTTP fixture runs locally.
// Nothing here creates a production WebAuth server or hardware passkey.
