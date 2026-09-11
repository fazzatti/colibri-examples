/**
 * Example: Local SEP-45 Server Fixture
 *
 * Provide discovery, challenge creation, authorization verification and a
 * short-lived JWT for sep45.ts. Keys and nonce history live in memory; this
 * is the local counterpart used to explain the client flow.
 */
import {
  Account,
  Address,
  authorizeEntry,
  Keypair,
  Operation,
  StrKey,
  TransactionBuilder,
  xdr,
} from "stellar-sdk";
import { Api, type Server as RpcServer } from "stellar-sdk/rpc";
import {
  decodeSep45AuthorizationEntries,
  encodeSep45AuthorizationEntries,
  Sep45AuthorizedChallenge,
  simulateSep45Challenge,
  verifySep45Challenge,
} from "@colibri/webauth";
import { getAddressCredentialsFromAuthEntry } from "@colibri/core";

/**
 * Keep the issued challenge nonces and reject a second successful use. This
 * in-memory store explains the replay boundary for one process; restarting
 * the fixture discards its history.
 */
class NonceStore {
  readonly #issued = new Set<string>();
  readonly #used = new Set<string>();

  issue(nonce: string): void {
    this.#issued.add(nonce);
  }

  consume(nonce: string): boolean {
    if (!this.#issued.has(nonce) || this.#used.has(nonce)) return false;

    this.#used.add(nonce);

    return true;
  }
}

export interface LocalWebAuthServer {
  homeDomain: string;
  close(): Promise<void>;
}

export interface LocalWebAuthServerConfig {
  networkPassphrase: string;
  rpc: RpcServer;
  webAuthContractId: string;
  server: Keypair;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "access-control-allow-origin": "*" },
  });
}

async function postedValue(
  request: Request,
  key: string,
): Promise<string | undefined> {
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json();

    return body && typeof body === "object"
      ? (body as Record<string, unknown>)[key] as string | undefined
      : undefined;
  }

  return new URLSearchParams(await request.text()).get(key) ?? undefined;
}

function base64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

/**
 * Issue a five-minute bearer token only after the submitted challenge has
 * been verified. This fixture signs with its process-local HMAC key; the
 * client example prints the claims rather than the bearer token.
 */
async function issueJwt(
  subject: string,
  signingKey: Promise<CryptoKey>,
): Promise<string> {
  const now = Math.floor(Date.now() / 1_000);
  const encode = (value: unknown) =>
    base64Url(new TextEncoder().encode(JSON.stringify(value)));

  // A JWT signs the encoded header and claims joined by a period.
  const header = encode({ alg: "HS256", typ: "JWT" });
  const claims = encode({
    iss: "https://colibri.test/webauth",
    sub: subject,
    iat: now,
    exp: now + 300,
  });
  const signingInput = `${header}.${claims}`;

  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function argumentScVal(values: Record<string, string>): xdr.ScVal {
  return xdr.ScVal.scvMap(
    Object.keys(values).sort().map((key) =>
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol(key),
        val: xdr.ScVal.scvString(values[key]),
      })
    ),
  );
}

export function startLocalWebAuthServer(
  config: LocalWebAuthServerConfig,
): LocalWebAuthServer {
  const nonces = new NonceStore();
  const tokenSigningKey = crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  let homeDomain = "";

  async function sep45Get(requestUrl: URL): Promise<Response> {
    const account = requestUrl.searchParams.get("account");

    if (!account) return json({ error: "account required" }, 400);

    const latestLedger = await config.rpc.getLatestLedger();

    const expiration = latestLedger.sequence + 30;
    const nonce = crypto.randomUUID();

    nonces.issue(nonce);

    const values = {
      account,
      home_domain: homeDomain,
      web_auth_domain: homeDomain,
      web_auth_domain_account: config.server.publicKey(),
      nonce,
    };

    /**
     * Build a simulation-only call to discover which accounts must authorize
     * web_auth_verify. The placeholder transaction source does not submit a
     * ledger transaction or need funding; the authorization entries are the
     * challenge material.
     */
    const recordingTransaction = new TransactionBuilder(
      new Account(StrKey.encodeEd25519PublicKey(new Uint8Array(32)), "-1"),
      {
        fee: "100",
        networkPassphrase: config.networkPassphrase,
      },
    )
      .addOperation(
        Operation.invokeContractFunction({
          contract: config.webAuthContractId,
          function: "web_auth_verify",
          args: [argumentScVal(values)],
        }),
      )
      .setTimeout(0)
      .build();

    const recording = await config.rpc.simulateTransaction(
      recordingTransaction,
      undefined,
      "record",
    );

    if (Api.isSimulationError(recording) || !recording.result) {
      throw new TypeError(
        `Could not record SEP-45 authorization: ${
          Api.isSimulationError(recording)
            ? recording.error
            : "missing simulation result"
        }`,
      );
    }

    /**
     * Recording discovers requirements, not a signed SEP-45 challenge.
     * Current RPC records V2; SEP-45 v0.1.1 requires legacy address
     * credentials. Choose the protocol's format BEFORE producing any
     * signature, because the credential version changes the signing
     * preimage. Never convert signed entries.
     */
    const entries = recording.result.auth.map((entry) => {
      if (entry.credentials.type !== "sorobanCredentialsAddressV2") {
        return entry;
      }

      const addressCredentials = entry.credentials.addressV2;

      return new xdr.SorobanAuthorizationEntry({
        rootInvocation: entry.rootInvocation,
        credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
          addressCredentials,
        ),
      });
    });

    /**
     * The server signs its own requirement before returning the challenge.
     * The client contract entry remains for the client's authorization
     * callback.
     */
    const serverIndex = entries.findIndex((entry) => {
      const credentials = getAddressCredentialsFromAuthEntry(entry);

      return credentials !== null &&
        Address.fromScAddress(credentials.address).toString() ===
          config.server.publicKey();
    });

    if (serverIndex === -1) {
      throw new TypeError("Recording simulation omitted the server entry");
    }

    entries[serverIndex] = await authorizeEntry(
      entries[serverIndex],
      config.server,
      expiration,
      config.networkPassphrase,
    );

    return json({
      authorization_entries: encodeSep45AuthorizationEntries(entries),
      network_passphrase: config.networkPassphrase,
    });
  }

  async function sep45Post(request: Request): Promise<Response> {
    const authorizationEntriesXdr = await postedValue(
      request,
      "authorization_entries",
    );

    if (!authorizationEntriesXdr) {
      return json({ error: "authorization_entries required" }, 400);
    }

    /**
     * One HTTP error boundary keeps verification failures as rejected
     * responses. Decode, verify the challenge shape, enforce authorization,
     * then issue a JWT.
     */
    try {
      const entries = decodeSep45AuthorizationEntries(
        authorizationEntriesXdr,
      );
      const rootInvocation = entries[0].rootInvocation;
      const root = rootInvocation.function;

      if (root.type !== "sorobanAuthorizedFunctionTypeContractFn") {
        throw new TypeError("Expected contract invocation");
      }

      const contractInvocation = root.value;
      const argument = contractInvocation.args[0];

      if (argument.type !== "scvMap") {
        throw new TypeError("Expected argument map");
      }

      // The verification contract receives one symbol-to-string argument map.
      const argumentEntries = argument.value ?? [];
      const argumentsMap = Object.fromEntries(
        argumentEntries.map((entry) => {
          if (
            entry.key.type !== "scvSymbol" || entry.val.type !== "scvString"
          ) throw new TypeError("Expected string argument");

          return [entry.key.value, entry.val.value];
        }),
      );

      const latest = await config.rpc.getLatestLedger();

      const verified = verifySep45Challenge({
        authorizationEntriesXdr,
        networkPassphrase: config.networkPassphrase,
        webAuthContractId: config.webAuthContractId,
        serverAccount: config.server.publicKey(),
        account: argumentsMap.account,
        homeDomain,
        webAuthDomain: homeDomain,
        latestLedger: latest.sequence,
      });
      const clientCredentials = getAddressCredentialsFromAuthEntry(
        entries[verified.clientEntryIndex],
      );

      if (!clientCredentials) {
        throw new TypeError("Expected client address credentials");
      }

      const clientExpiration = clientCredentials.signatureExpirationLedger;

      // This simulation executes the account contract's custom authorization.
      const authorizedChallenge = new Sep45AuthorizedChallenge(
        verified,
        entries,
        clientExpiration,
      );

      await simulateSep45Challenge(
        authorizedChallenge,
        {
          rpc: config.rpc,
          networkPassphrase: config.networkPassphrase,
          webAuthContractId: config.webAuthContractId,
        },
      );

      // Consume the nonce only after authorization succeeds to prevent replay.
      if (!nonces.consume(verified.arguments.nonce)) {
        return json({ error: "challenge already used" }, 409);
      }

      const jwt = await issueJwt(verified.account, tokenSigningKey);

      return json({ token: jwt });
    } catch (cause) {
      return json({
        error: cause instanceof Error ? cause.message : String(cause),
      }, 400);
    }
  }

  /**
   * Expose three local routes: discovery TOML, GET for a fresh challenge and
   * POST for the signed response. Bind to loopback on an available port so
   * the lesson needs no public HTTP service.
   */
  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const url = new URL(request.url);

      if (
        request.method === "GET" &&
        url.pathname === "/.well-known/stellar.toml"
      ) {
        return new Response(
          [
            `SIGNING_KEY = "${config.server.publicKey()}"`,
            `NETWORK_PASSPHRASE = "${config.networkPassphrase}"`,
            `WEB_AUTH_FOR_CONTRACTS_ENDPOINT = "http://${homeDomain}/sep45"`,
            `WEB_AUTH_CONTRACT_ID = "${config.webAuthContractId}"`,
          ].join("\n"),
          { headers: { "content-type": "text/plain" } },
        );
      }

      if (request.method === "GET" && url.pathname === "/sep45") {
        return await sep45Get(url);
      }

      if (request.method === "POST" && url.pathname === "/sep45") {
        return await sep45Post(request);
      }

      return json({ error: "not found" }, 404);
    },
  );
  const address = server.addr as Deno.NetAddr;

  homeDomain = `${address.hostname}:${address.port}`;

  return {
    get homeDomain() {
      return homeDomain;
    },
    async close() {
      await server.shutdown();
    },
  };
}
