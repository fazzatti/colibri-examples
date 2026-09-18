# Colibri web field guide

A React application for learning Stellar by running one focused example at a
time. Every network operation uses **Testnet**. A sidebar groups 29 lessons
covering all 33 public hooks in `@colibri/react` 0.2. Each lesson has its own
commented TSX file, live controls, observable state and the actual source beside
it. The provider and connection persist as you navigate; only the active lesson
mounts.

## Start the application

Requires **Deno 2.9.6+**. From the repository root, enter the example directory;
all subsequent commands run there:

```sh
cd examples/web
deno task install
deno task dev
```

Open **http://127.0.0.1:5173**. Start with **Network & provider**: the latest
Testnet ledger updates every five seconds, without connecting a wallet.

`install` installs the pinned npm/JSR dependencies and generates the local
counter client **offline**, directly from the existing
[counter Wasm](../contract-bindings/contract/counter.wasm). Inspect
`src/generated/counter/index.ts`, `constants.ts` and `types.ts`. Generated code
is ignored by Git and uses direct Core imports (`includeColibri: false`). It is
not a published package or an on-chain deployment.

Dependencies and tasks belong to this example's `deno.json`. Deno installs npm
packages locally for Vite, including Colibri through JSR's npm bridge. No
separate Node or npm installation is required.

## Prepare Testnet data (optional)

Public reads can use addresses you enter yourself. For ready-to-run account,
trustline and counter examples:

```sh
deno task setup
```

This script:

1. Creates and funds two disposable Testnet accounts with Friendbot.
2. Creates a GUIDE trustline and issues 25 GUIDE to the example account.
3. Uploads the existing counter Wasm and deploys a fresh instance.
4. Writes **public identifiers only** to the ignored `.env.local` file.

The setup process destroys its signing handles on exit. The fixture account is a
public read/payment recipient, not your connected wallet. The counter permits
public increments, starts at zero, and caps its count at 100. A connected,
funded Testnet wallet pays for writes. Rerun setup after a Testnet reset,
archived fixture state, or the counter reaching its limit. Each run creates new
fixtures and replaces the three `VITE_EXAMPLE_*` values while preserving other
settings. Vite restarts when `.env.local` changes; reload the page afterward.

Alternatively, set `VITE_EXAMPLE_ACCOUNT`, `VITE_EXAMPLE_ISSUER` and
`VITE_EXAMPLE_COUNTER` to your own matching **Testnet** fixtures. Never put
secrets in `VITE_` variables: Vite includes them in browser code.

## Wallets and ecosystem integrations

**Wallets Kit is the primary integration.** Install
[Freighter](https://www.freighter.app/), enable/select Testnet in the extension,
and choose **Connect a wallet → Connect with Wallets Kit**. Fund the connected
address using the **Compose an action** lesson before submitting transactions.

The Kit is initialized with one deliberately explicit module: Freighter. It owns
selection UI, extension interaction and prompts. Colibri's adapter converts
those into a general connection and declared signer capabilities. The provider
checks the actual wallet network passphrase and invalidates stale authority on
identity changes.

| Setup file                                             | Responsibility                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [wallets-kit.ts](src/setup/wallets-kit.ts)             | Kit initialization, selected modules, explicit envelope + G-account auth-entry capabilities |
| [freighter.ts](src/setup/freighter.ts)                 | Independent direct Freighter adapter; envelope signing only                                 |
| [practice-identity.ts](src/setup/practice-identity.ts) | Explicit, disposable in-memory connector for SEP-53 and SEP-10 lessons                      |
| [provider.tsx](src/app/provider.tsx)                   | One Testnet configuration and query provider around all routes                              |

To support another Kit wallet, import its module, add it to `modules`, and
review its signing support before adding a capability rule. Some modules need
project IDs, initialization or additional dependencies. A method existing on the
Kit does not mean every wallet supports it. See the in-app **wallet ecosystem**
lesson and
[upstream Kit documentation](https://stellarwalletskit.dev/kit-structure.html).

For an existing/custom integration, use Colibri's `createWalletConnector`
contract. Connecting an account, signing an envelope, signing Soroban entries,
and signing messages are different capabilities. Smart accounts require an
explicit authorization implementation; this app does not imply universal
contract-wallet support.

The **practice identity** is created only by a clearly labeled button. It is a
real disposable key, never an imported wallet secret, and is destroyed on
disconnect/reload. It has no persistence or recovery. It can also be funded on
Testnet to exercise the transaction lessons without an extension. This is a
learning convenience, not a production custody pattern.

## Guided transaction flow

1. Connect through Wallets Kit with Freighter on Testnet.
2. Copy the connected G-address to **Compose an action** and request funding.
   Friendbot may reject already-funded accounts or rate-limit requests.
3. Open **Classic payment**, enter an existing Testnet recipient (setup provides
   one), and send exactly **1 XLM**. Approve the extension's signature request.
4. Follow **Inspect transaction** to see the actual RPC status/hash.
5. Run **Simulate Soroban**, then read the counter: the count stays unchanged.
6. Use **Invoke with signers**, **Invoke with a wallet**, or **Submit Soroban**
   to commit +1. A fee is charged and the stored count increases.
7. Keep **Contract events** open in another tab while invoking to see the event.

Write buttons state their effect and are disabled while pending. Mutations do
not retry automatically. Pending covers the whole Core pipeline; the app does
not invent signing/submission phases. A timeout can be ambiguous: inspect the
account/transaction before deciding to submit again. Hash lookup `NOT_FOUND` is
not proof of failure and can also reflect limited RPC retention.

## Authentication and discovery (optional local server)

In a second terminal, enter `examples/web` and run:

```sh
deno task auth
```

The loopback server at **http://127.0.0.1:8787** exposes a SEP-1 file and SEP-10
challenge endpoint using the Testnet passphrase. It validates challenge domain,
server/client signatures, expiry, single use, and existing account thresholds
before issuing a signed, two-minute JWT. Server keys and pending challenges are
memory-only. No challenge transaction is submitted to the ledger.

Use **Discover stellar.toml**, **Discover WebAuth**, then **Authenticate & log
out**. Create a practice identity and authenticate. Expect
`anonymous →
authenticating → authenticated`; local logout, disconnect, identity
change, expiry, or leaving this lesson clears the session. No JWT is shown in
diagnostics, query data or browser storage. Repeated authentication requests use
new challenges.

The discovery/session examples supply an explicit forwarding `fetch` callback.
WebAuth 1.1.0 stores that callback on its transport; the wrapper preserves the
Window receiver required by native browser fetch. Both lessons use the same
query scope for this policy.

The current Colibri SEP-10 client requires a full keypair signer. The Kit's
transaction adapter does **not** satisfy that interface, so the lesson uses its
own explicit practice connector. SEP-45 is a separate contract-account flow; see
the existing [WebAuth CLI examples](../webauth/README.md).

This server is a local protocol fixture, not a production authentication
service. It binds only to loopback, accepts this app's dev/preview origins, and
has no persistent signing keys, revocation service, production JWT audience
policy or TLS deployment. Restart it to rotate its key; reload client discovery
afterward. HTTP is permitted only for this fixed local development domain in the
app.

## Hook-to-lesson map

Each source below is also displayed in the running app. Search the sidebar by
hook name. Related connection primitives share a lesson; convenience and
granular transaction/client variants remain independent.

| Lesson/source                                                    | Hooks                                                  | Expected result                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| [Network/provider](src/examples/network/overview.tsx)            | useColibriConfig, useNetwork, useRpc, useLatestLedger  | Live ledger and authoritative network         |
| [Wallet](src/examples/wallets/wallet.tsx)                        | useWallet                                              | Connect/disconnect through the Kit            |
| [Connection](src/examples/wallets/connection.tsx)                | useConnection, useConnect, useReconnect, useDisconnect | Explicit lifecycle and silent restore         |
| [Direct Freighter](src/examples/wallets/freighter.tsx)           | useConnect, useConnection, useDisconnect               | Independent extension adapter                 |
| [Signers](src/examples/signing/signers.tsx)                      | useSigners                                             | Explicit capability list                      |
| [Message](src/examples/signing/message.tsx)                      | useSignMessage                                         | Verified SEP-53 signature                     |
| [Account](src/examples/accounts/account.tsx)                     | useAccount                                             | Account data or visible missing-account error |
| [Trustline](src/examples/accounts/trustline.tsx)                 | useTrustline                                           | GUIDE trustline, balance and limits           |
| [Ledger entries](src/examples/accounts/ledger-entries.tsx)       | useLedgerEntries                                       | Stable reader composed with a query           |
| [XLM](src/examples/assets/xlm.tsx)                               | useBalance                                             | Exact stroops and formatted XLM               |
| [Classic asset](src/examples/assets/classic.tsx)                 | useBalance                                             | Code + issuer balance                         |
| [SEP-41](src/examples/assets/token.tsx)                          | useBalance, useTokenMetadata                           | Contract balance and declared decimals        |
| [Full client](src/examples/contracts/instance.tsx)               | useContract                                            | Same generated instance across rerenders      |
| [Client read](src/examples/contracts/read.tsx)                   | useContractRead                                        | Typed simulated getCount                      |
| [Spec read](src/examples/contracts/spec-read.tsx)                | useContractReadSpec                                    | ABI get_count without a full client           |
| [Explicit invoke](src/examples/contracts/invoke.tsx)             | useContractInvoke                                      | Committed increment and precise invalidation  |
| [Wallet invoke](src/examples/contracts/wallet-invoke.tsx)        | useWalletContractInvoke                                | Wallet-derived transaction authority          |
| [Classic payment](src/examples/transactions/classic-payment.tsx) | useClassicTransaction                                  | Confirmed 1 XLM payment                       |
| [Simulation](src/examples/transactions/simulate.tsx)             | useSimulateSorobanTransaction                          | Resources/auth without a write                |
| [Soroban submission](src/examples/transactions/soroban.tsx)      | useSorobanTransaction                                  | Native operation through the Core pipeline    |
| [Hash lookup](src/examples/transactions/lookup.tsx)              | useTransaction                                         | SUCCESS, FAILED or NOT_FOUND                  |
| [Confirmation](src/examples/transactions/confirmation.tsx)       | useWaitForTransaction                                  | Explicit polling and stop control             |
| [Events](src/examples/events/events.tsx)                         | useContractEvents                                      | Bounded live window, observer cleanup         |
| [SEP-1](src/examples/discovery/toml.tsx)                         | useStellarToml                                         | Testnet service declarations                  |
| [Identicon](src/examples/discovery/identicon.tsx)                | useIdenticon, AccountIdenticon component               | Local deterministic SVG                       |
| [Custom mutation](src/examples/queries/mutation.tsx)             | useColibriMutation                                     | Friendbot action and balance invalidation     |
| [WebAuth discovery](src/examples/sessions/client.tsx)            | useWebAuthClient                                       | Discovered protocol client                    |
| [Session](src/examples/sessions/session.tsx)                     | useWebAuth, useSession                                 | Real SEP-10 exchange and memory-only session  |

The 29th page is the
[ecosystem integration guide](src/examples/wallets/ecosystem.tsx).

## Structure and dependency boundaries

- `src/app/`: application shell, catalog, stable provider and styling.
- `src/examples/<context>/`: independent instructional components. SDK actions
  stay visible here; there is no shared execution runner.
- `src/setup/`: network, wallet adapters and optional public fixture
  identifiers.
- `src/components/`: presentation and exact amount formatting.
- `src/generated/`: ignored, reproducible counter bindings.
- `scripts/`: offline generation and optional Testnet provisioning.
- `auth-server/`: optional local SEP-10 fixture.

The web app owns its `deno.json` imports, tasks, compiler options and
`deno.lock`. Root CLI dependency versions are unchanged. The Deno Vite plugin
uses that same import map for browser builds. `.npmrc` only identifies the JSR
npm registry; dependency versions all live in `deno.json`. Features and their
source views load on demand by route; the wallet SDK remains an
application-owned dependency. The native Stellar SDK remains a substantial
shared browser dependency.

Hash routes (for example `/#contract-read`) work on static hosting without
server-side route rewrites. `base: "./"` also permits a subdirectory deployment.
There is no server rendering, Fresh/Preact compatibility layer or deployment in
this example.

## Verify and build

```sh
deno task check
deno task build
deno task preview
```

`check` checks TS/TSX, setup/server scripts, Deno lint and formatting. `build`
creates `dist/`; preview serves it at **http://127.0.0.1:4173**. Build again
after fixture identifiers change. The local `deno.lock` is the dependency source
of truth; `deno task install` uses it frozen and regenerates the counter
bindings. Use `deno install` only when intentionally updating the local
dependency graph.

Following this repository's convention, these are learning examples rather than
a new test suite. A manual browser checklist is in
[VERIFICATION.md](VERIFICATION.md). Read
[Colibri's React API](https://jsr.io/@colibri/react/doc) for full signatures,
including query cache identity, session lifetime and signer contracts.
