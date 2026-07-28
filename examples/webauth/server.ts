import { Buffer } from "buffer";
import {
  Account,
  Address,
  authorizeEntry,
  Keypair,
  Operation,
  StrKey,
  type Transaction,
  TransactionBuilder,
  xdr,
} from "stellar-sdk";
import { Api, type Server as RpcServer } from "stellar-sdk/rpc";
import {
  decodeSep45AuthorizationEntries,
  encodeSep45AuthorizationEntries,
  Sep45AuthorizedChallenge,
  simulateSep45Challenge,
  verifySep10Challenge,
  verifySep45Challenge,
} from "@colibri/webauth";

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
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

async function issueJwt(
  subject: string,
  signingKey: Promise<CryptoKey>,
): Promise<string> {
  const now = Math.floor(Date.now() / 1_000);
  const encode = (value: unknown) =>
    base64Url(new TextEncoder().encode(JSON.stringify(value)));
  const signingInput = `${encode({ alg: "HS256", typ: "JWT" })}.${
    encode({
      iss: "https://colibri.test/webauth",
      sub: subject,
      iat: now,
      exp: now + 300,
    })
  }`;
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

  function sep10Get(requestUrl: URL): Response {
    const account = requestUrl.searchParams.get("account");
    if (!account) return json({ error: "account required" }, 400);
    const nonce = Buffer.from(
      crypto.getRandomValues(new Uint8Array(48)),
    ).toString("base64");
    nonces.issue(nonce);
    const now = Math.floor(Date.now() / 1_000);
    const transaction = new TransactionBuilder(
      new Account(config.server.publicKey(), "-1"),
      {
        fee: "100",
        networkPassphrase: config.networkPassphrase,
        timebounds: { minTime: now, maxTime: now + 300 },
      },
    )
      .addOperation(
        Operation.manageData({
          source: account,
          name: `${homeDomain} auth`,
          value: nonce,
        }),
      )
      .addOperation(
        Operation.manageData({
          source: config.server.publicKey(),
          name: "web_auth_domain",
          value: homeDomain,
        }),
      )
      .build();
    transaction.sign(config.server);
    return json({
      transaction: transaction.toXDR(),
      network_passphrase: config.networkPassphrase,
    });
  }

  async function sep10Post(request: Request): Promise<Response> {
    const transactionXdr = await postedValue(request, "transaction");
    if (!transactionXdr) return json({ error: "transaction required" }, 400);
    try {
      const transaction = TransactionBuilder.fromXDR(
        transactionXdr,
        config.networkPassphrase,
      ) as Transaction;
      const first = transaction.operations[0];
      if (
        first?.type !== "manageData" || !first.source || !first.value
      ) {
        throw new TypeError("invalid first operation");
      }
      verifySep10Challenge({
        transactionXdr,
        networkPassphrase: config.networkPassphrase,
        serverAccount: config.server.publicKey(),
        account: first.source,
        homeDomain,
        webAuthDomain: homeDomain,
      });
      const client = Keypair.fromPublicKey(first.source);
      if (
        !transaction.signatures.some((signature) =>
          client.verify(transaction.hash(), signature.signature())
        )
      ) {
        throw new TypeError("missing client signature");
      }
      if (!nonces.consume(Buffer.from(first.value).toString())) {
        return json({ error: "challenge already used" }, 409);
      }
      const jwt = await issueJwt(first.source, tokenSigningKey);
      return json({ token: jwt });
    } catch (cause) {
      return json({
        error: cause instanceof Error ? cause.message : String(cause),
      }, 400);
    }
  }

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
    const recordingTransaction = new TransactionBuilder(
      new Account(StrKey.encodeEd25519PublicKey(Buffer.alloc(32)), "-1"),
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
    const entries = recording.result.auth;
    const serverIndex = entries.findIndex((entry) =>
      entry.credentials().switch().name === "sorobanCredentialsAddress" &&
      Address.fromScAddress(entry.credentials().address().address())
          .toString() === config.server.publicKey()
    );
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
    try {
      const entries = decodeSep45AuthorizationEntries(
        authorizationEntriesXdr,
      );
      const map = entries[0].rootInvocation()
        .function()
        .contractFn()
        .args()[0]
        .map();
      const argumentsMap = Object.fromEntries(
        (map ?? []).map((entry) => [
          entry.key().sym().toString(),
          entry.val().str().toString(),
        ]),
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
      const clientExpiration = entries[verified.clientEntryIndex]
        .credentials()
        .address()
        .signatureExpirationLedger();
      await simulateSep45Challenge(
        new Sep45AuthorizedChallenge(
          verified,
          entries,
          clientExpiration,
        ),
        {
          rpc: config.rpc,
          networkPassphrase: config.networkPassphrase,
          webAuthContractId: config.webAuthContractId,
        },
      );
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
            `WEB_AUTH_ENDPOINT = "http://${homeDomain}/sep10"`,
            `WEB_AUTH_FOR_CONTRACTS_ENDPOINT = "http://${homeDomain}/sep45"`,
            `WEB_AUTH_CONTRACT_ID = "${config.webAuthContractId}"`,
          ].join("\n"),
          { headers: { "content-type": "text/plain" } },
        );
      }
      if (request.method === "GET" && url.pathname === "/sep10") {
        return sep10Get(url);
      }
      if (request.method === "POST" && url.pathname === "/sep10") {
        return await sep10Post(request);
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
