/**
 * Run the local Testnet SEP-10 protocol fixture with an owned lifetime.
 *
 * Vite starts it for dev/preview; main.ts can also run it independently. Each
 * instance owns its signing key and pending challenges in memory. It binds only
 * to loopback and accepts the documented development/preview origins. No
 * challenge transaction is submitted to Stellar and no token is logged.
 *
 * @module
 */
import { Buffer } from "node:buffer";
import {
  Keypair,
  Networks,
  StrKey,
  TransactionBuilder,
  WebAuth,
} from "@stellar/stellar-sdk";
import { buildAccountLedgerKey, LedgerEntries } from "@colibri/core/ledger";
import { Server } from "@colibri/core/rpc";

export function startAuthServer() {
  // A loopback-only protocol fixture. Server keys and challenges disappear on
  // restart. No challenge transaction is submitted to Stellar.
  const homeDomain = "127.0.0.1:8787";
  const endpoint = `http://${homeDomain}/auth`;
  const serverKey = Keypair.random();
  const rpc = new Server("https://soroban-testnet.stellar.org");
  const ledger = new LedgerEntries({ rpc });
  const challenges = new Map<string, number>();
  const allowedOrigins = new Set([
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "http://localhost:5173",
    "http://localhost:4173",
  ]);

  function pruneChallenges() {
    const now = Math.floor(Date.now() / 1000);
    for (const [hash, expiry] of challenges) {
      if (expiry <= now) challenges.delete(hash);
    }
  }

  function issueToken(account: string) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" }))
      .toString("base64url");
    const claims = Buffer.from(
      JSON.stringify({ iss: endpoint, sub: account, iat: now, exp: now + 120 }),
    ).toString("base64url");
    const payload = `${header}.${claims}`;
    const signature = Buffer.from(
      serverKey.sign(new TextEncoder().encode(payload)),
    ).toString("base64url");
    return `${payload}.${signature}`;
  }

  async function authenticate(transaction: string) {
    // Verify the server signature, operation/domain bindings and time bounds
    // before considering any client signatures. A body hash binds the nonce.
    const challenge = WebAuth.readChallengeTx(
      transaction,
      serverKey.publicKey(),
      Networks.TESTNET,
      homeDomain,
      homeDomain,
    );
    const account = challenge.clientAccountID;
    if (!StrKey.isValidEd25519PublicKey(account)) {
      throw new Error("This fixture accepts G-accounts.");
    }
    const hash = Buffer.from(challenge.tx.hash()).toString("hex");
    pruneChallenges();
    if (!challenges.has(hash)) {
      throw new Error("Unknown, expired or already used challenge.");
    }

    // Unfunded identities authenticate with their master key. Existing accounts
    // must satisfy their current medium threshold, including on-chain signers.
    const key = buildAccountLedgerKey({ accountId: account as `G${string}` });
    const response = await rpc.getLedgerEntries(key);
    let threshold = 1;
    let signers: Parameters<typeof WebAuth.verifyChallengeTxThreshold>[4] = [
      { key: account, weight: 1, type: "ed25519_public_key" },
    ];
    if (response.entries.length) {
      const entry = await ledger.account({
        accountId: account as `G${string}`,
      });
      threshold = Math.max(1, entry.thresholds.medium);
      signers = [
        {
          key: account,
          weight: entry.thresholds.masterWeight,
          type: "ed25519_public_key",
        },
        ...entry.signers.filter((signer) => signer.key.type === "ed25519").map((
          signer,
        ) => ({
          key: signer.key.value,
          weight: signer.weight,
          type: "ed25519_public_key",
        })),
      ];
    }
    WebAuth.verifyChallengeTxThreshold(
      transaction,
      serverKey.publicKey(),
      Networks.TESTNET,
      threshold,
      signers,
      homeDomain,
      homeDomain,
    );

    // Consume after asynchronous verification, with a second check to prevent
    // concurrent exchanges from redeeming the same challenge twice.
    if (!challenges.delete(hash)) throw new Error("Challenge already used.");
    return issueToken(account);
  }

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.host !== homeDomain) {
      return new Response("Unexpected host", { status: 400 });
    }
    // Dev/preview can reuse a separately started fixture, but must not treat
    // an unrelated service on this port as the authentication server.
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        fixture: "colibri-web-sep10",
        version: 1,
        networkPassphrase: Networks.TESTNET,
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }
    if (
      request.method === "GET" && url.pathname === "/.well-known/stellar.toml"
    ) {
      return new Response(
        `VERSION="2.7.0"\nNETWORK_PASSPHRASE="${Networks.TESTNET}"\nSIGNING_KEY="${serverKey.publicKey()}"\nWEB_AUTH_ENDPOINT="${endpoint}"\n`,
        { headers: { "content-type": "text/plain" } },
      );
    }
    if (request.method === "GET" && url.pathname === "/auth") {
      const account = url.searchParams.get("account") ?? "";
      if (!StrKey.isValidEd25519PublicKey(account)) {
        return Response.json({ error: "Supply a G-account." }, { status: 400 });
      }
      pruneChallenges();
      if (challenges.size >= 256) {
        return Response.json({
          error: "Too many pending challenges; try again shortly.",
        }, { status: 429 });
      }
      const transaction = WebAuth.buildChallengeTx(
        serverKey,
        account,
        homeDomain,
        120,
        Networks.TESTNET,
        homeDomain,
      );
      const tx = TransactionBuilder.fromXDR(transaction, Networks.TESTNET);
      challenges.set(
        Buffer.from(tx.hash()).toString("hex"),
        Math.floor(Date.now() / 1000) + 120,
      );
      return Response.json({
        transaction,
        network_passphrase: Networks.TESTNET,
      });
    }
    if (request.method === "POST" && url.pathname === "/auth") {
      const body = await request.text();
      if (body.length > 20_000) {
        return Response.json({ error: "Challenge is too large." }, {
          status: 413,
        });
      }
      const submitted = JSON.parse(body);
      if (typeof submitted.transaction !== "string") {
        throw new Error("Expected transaction XDR.");
      }
      const token = await authenticate(submitted.transaction);
      return Response.json({ token });
    }
    return new Response("Not found", { status: 404 });
  }

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 8787 },
    async (request) => {
      const origin = request.headers.get("origin");
      if (origin && !allowedOrigins.has(origin)) {
        return new Response("Origin not allowed", { status: 403 });
      }
      let response: Response;
      try {
        response = await handle(request);
      } catch (cause) {
        response = Response.json({
          error: cause instanceof Error ? cause.message : String(cause),
        }, { status: 400 });
      }
      response.headers.set("cache-control", "no-store");
      if (origin) response.headers.set("access-control-allow-origin", origin);
      response.headers.set("vary", "Origin");
      response.headers.set(
        "access-control-allow-methods",
        "GET, POST, OPTIONS",
      );
      response.headers.set("access-control-allow-headers", "content-type");
      return response;
    },
  );
  console.log(
    `Local Testnet SEP-10 fixture: ${endpoint}. Tokens expire after two minutes.`,
  );

  return server;
}
