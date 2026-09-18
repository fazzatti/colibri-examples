# Colibri web examples

A React application for learning Stellar by running one focused example at a
time. Every network operation uses **Testnet**. A sidebar groups 29 lessons
covering all 33 public hooks in `@colibri/react` 0.2. Each lesson has its own
commented TSX file, live controls, observable state and a didactic explanation.
Each explanation covers the task, ordered steps, expected result, hooks and
specific Colibri documentation. Previous/next links follow the sidebar order.
The provider and connection persist as you navigate; only the active lesson
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
Testnet ledger loads once, without connecting a wallet. Refresh manually or
enable **Auto-refresh every 5 seconds** to see a countdown between requests. A
spinner indicates an active request. Disable the option or leave the page to
stop polling.

Dev also starts the local SEP-10 fixture on **http://127.0.0.1:8787** for
WebAuth and discovery lessons. Preview does the same. A compatible fixture
already running there is reused; another service on that port causes a clear
startup error. Stop the owning process when finished. If you already had the
older dev server running, restart `deno task dev` once to load this startup
integration.

`install` installs the pinned npm/JSR dependencies and generates the local
counter client **offline**, directly from the existing
[counter Wasm](../contract-bindings/contract/counter.wasm). Inspect
`src/generated/counter/index.ts`, `constants.ts` and `types.ts`. Generated code
is ignored by Git and uses direct Core imports (`includeColibri: false`). It is
not a published package or an on-chain deployment.

Dependencies and tasks belong to this example's `deno.json`. Deno installs npm
packages locally for Vite, including Colibri through JSR's npm bridge. No
separate Node or npm installation is required.

## Follow a lesson into its source

Use the [hook-to-lesson map](#hook-to-lesson-map) below to open the runnable
`.tsx` file for any page. Each file starts with its learning objective,
prerequisites, actions to try and expected result. Comments immediately before
the relevant blocks explain the hook inputs, Stellar concepts and state changes.

Read a lesson in this order:

1. **Setup and ownership.** The default export is the page entry point. Some
   pages first require a public fixture or wrap their inner component in
   [SignerProvider](src/setup/signer-provider.tsx). That wrapper offers a local
   signer or the connected wallet; the example's SDK calls stay in the lesson.
2. **Inputs and hooks.** Follow validated addresses into the read hooks. Notice
   which queries start with valid input and which wait for an explicit action.
   [Account](src/examples/accounts/account.tsx), for example, separates draft
   input from the account selected by submitting the form.
3. **User action.** Trace the button into its handler or mutation. In
   [explicit contract invocation](src/examples/contracts/invoke.tsx), account
   setup comes before the call that supplies arguments, source, signers and
   fees. Reads, simulations, signatures and submissions have different effects.
4. **Result and lifetime.** Follow success/error state into the rendered output,
   any affected query refresh, and cleanup on source changes or navigation.
   [Message signing](src/examples/signing/message.tsx) keeps signing and public
   verification separate; [sessions](src/examples/sessions/session.tsx) own and
   destroy their authentication state.

Each adjacent `.guide.ts` contains the explanations and documentation links
shown in the app, rather than executable SDK calls. For example,
[invoke.guide.ts](src/examples/contracts/invoke.guide.ts) accompanies the
invocation source. Shared [display components](src/components/lesson.tsx) render
query/mutation states;
[TestnetAccountSetup](src/components/testnet-account-setup.tsx) is the shared
funding control. [fixtures.ts](src/setup/fixtures.ts) reads public identifiers
and validates address syntax, while [provider.tsx](src/app/provider.tsx)
configures the app's Testnet network and external wallets.

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
public increments, starts at zero, and caps its count at 100. Writes use either
the lesson-owned funded signer or your connected, funded Testnet wallet. Rerun
setup after a Testnet reset, archived fixture state, or the counter reaching its
limit. Each run creates new fixtures and replaces the three `VITE_EXAMPLE_*`
values while preserving other settings. Vite restarts when `.env.local` changes;
reload the page afterward.

Alternatively, set `VITE_EXAMPLE_ACCOUNT`, `VITE_EXAMPLE_ISSUER` and
`VITE_EXAMPLE_COUNTER` to your own matching **Testnet** fixtures. Never put
secrets in `VITE_` variables: Vite includes them in browser code.

## Wallet connectivity

**Wallets Kit is the primary integration.** Install
[Freighter](https://www.freighter.app/), enable/select Testnet in the extension,
and click **Connect wallet** in the header of any page (or use the dedicated
wallet lesson). Wallet transaction pages include their own account check and
**Fund with Friendbot** action, so there is no earlier funding lesson to
complete.

The Kit is initialized with one deliberately explicit module: Freighter. It owns
selection UI, extension interaction and prompts. Colibri's adapter converts
those into a general connection and declared signer capabilities. The provider
checks the actual wallet network passphrase and invalidates stale authority on
identity changes.

| Setup file                                                     | Responsibility                                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [wallets-kit.ts](src/setup/wallets-kit.ts)                     | Kit initialization and explicit envelope, G-account auth-entry and SEP-53 capabilities |
| [wallet-message-signer.ts](src/setup/wallet-message-signer.ts) | Adapt and verify the Kit/Freighter SEP-53 signature bytes                              |
| [freighter.ts](src/setup/freighter.ts)                         | Independent direct Freighter adapter; envelope signing only                            |
| [practice-identity.ts](src/setup/practice-identity.ts)         | Factory for separate, disposable lesson identities                                     |
| [signer-provider.tsx](src/setup/signer-provider.tsx)           | Per-lesson source choice, capability checks and local-key cleanup                      |
| [provider.tsx](src/app/provider.tsx)                           | Shared provider for real wallet connections across routes                              |

To support another Kit wallet, import its module, add it to `modules`, and
review its signing support before adding a capability rule. Some modules need
project IDs, initialization or additional dependencies. A method existing on the
Kit does not mean every wallet supports it. See the in-app **Wallet
connectivity** lesson and
[upstream Kit documentation](https://stellarwalletskit.dev/kit-structure.html).

For an existing/custom integration, use Colibri's `createWalletConnector`
contract. Connecting an account, signing an envelope, signing Soroban entries,
and signing messages are different capabilities. Smart accounts require an
explicit authorization implementation; this app does not imply universal
contract-wallet support.

### Choose the signer on each page

Signer-dependent examples start with two buttons: **Create local signer** or
**Use connected wallet**. Connect from the header to enable the wallet option.
The selected address is shown before any signing action. The header always
represents the external wallet; a local key never replaces it.

[SignerProvider](src/setup/signer-provider.tsx) supplies the chosen
configuration to the lesson's unmodified Colibri hooks. Wallet mode retains the
original provider's connection-change guards. Local mode has a lesson-owned
connector and key. Switching sources resets results/forms and destroys the local
key when leaving local mode; leaving the page also destroys it. Choice buttons
are disabled while signing/submission is pending. Nothing persists in storage.

Capabilities remain explicit. Transactions need an envelope signer. SEP-53
message signing is enabled for **Wallets Kit with Freighter**, whose base64
signature is decoded and verified before returning bytes to the hook. The direct
Freighter adapter remains envelope-only. Unsupported wallet options explain the
missing capability; they never silently substitute a local signer.

**SEP-10 limitation:** Colibri WebAuth currently calls synchronous raw-key
`sign()`. Wallets Kit/direct Freighter expose asynchronous approval-based
signing, so they cannot be selected for that lesson. Create its local signer
instead; a wallet integration exposing a genuine complete Core keypair signer
could use the same selector. See the
[Freighter message API](https://docs.freighter.app/docs/playground/signmessage/)
for the separate SEP-53 capability.

## Run a transaction example independently

- **Invoke with signers**, **Invoke with a wallet**, **Submit Soroban** and
  **Classic payment** support both signer choices. The first supplies authority
  explicitly; the wallet convenience hook derives it from the selected
  connection.
- After choosing, use **Fund with Friendbot** on that page if the account does
  not exist. A generated key alone is not a ledger account. Funding waits for
  RPC visibility; submission is disabled until the source account check
  succeeds. Funding retries retain the selected key.
- Classic payment additionally checks the recipient. Enter an existing address,
  use the public fixture, or generate/fund a practice recipient on the page. Its
  key is discarded because the exercise only sends Testnet XLM to it.
- Contract examples use the public counter from `deno task setup`; missing
  fixtures show that command. No prior UI lesson prepares another lesson's key.

After a submission, follow **Inspect transaction** to check the RPC result.
**Simulate Soroban** can run independently too: simulation leaves the stored
count unchanged. **Contract events** can observe an invocation in another tab.

Write buttons state their effect and are disabled while pending. Mutations do
not retry automatically. Pending covers the whole Core pipeline; the app does
not invent signing/submission phases. A timeout can be ambiguous: inspect the
account/transaction before deciding to submit again. Hash lookup `NOT_FOUND` is
not proof of failure and can also reflect limited RPC retention.

## Sign and verify a message

Open **Sign and verify a message**. Choose a local signer or a supported
connected wallet, enter text and click **Sign message**. Copy the resulting
signature as 128 hexadecimal characters (64 bytes). Signing fills the
verification form but does not verify.

Click **Verify signature** to check the message, public key and signature with
SEP-53. Edit any verification field to clear the previous result; change the
message and verify again to observe a mismatch. You can also paste independently
obtained values without connecting an identity. Invalid hex is reported before
verification. Neither operation submits a transaction or requires funding.

## Authentication, discovery and activity

`deno task dev` and `deno task preview` start the loopback authentication
fixture automatically. You can also run it independently from `examples/web`
when using another frontend server:

```sh
deno task auth
```

Keep that terminal running. The loopback server at **http://127.0.0.1:8787**
exposes a SEP-1 file and SEP-10 challenge endpoint using the Testnet passphrase.
It validates challenge domain, server/client signatures, expiry, single use, and
existing account thresholds before issuing a signed, two-minute JWT. Server keys
and pending challenges are memory-only. No challenge transaction is submitted to
the ledger.

Open **Authenticate & log out** directly; it discovers its own client. Create a
local signer and authenticate. **Discover stellar.toml** and **Discover
WebAuth** are separate examples, not prerequisites. Expect
`anonymous →
authenticating → authenticated`; local logout, disconnect, identity
change, expiry, or leaving this lesson clears the session. No JWT is shown in
diagnostics, query data or browser storage. Repeated authentication requests use
new challenges.

### Follow the activity

All three pages—SEP-1 discovery, WebAuth discovery and authentication—show a
small **Activity** log. It retains the last 20 events with timestamps, including
HTTP requests/responses, validated discovery and session changes. A spinner
indicates an actual outstanding request; fast completed steps remain readable.
Discovery uses explicit refresh/retry controls with background refetch disabled.

The SEP-10 sequence is: discover stellar.toml → request a challenge → validate
and sign it in Colibri → exchange the signed challenge → authenticate the
session. Activity observes HTTP boundaries and session state. A POST entry means
client validation/signing has completed; it does not claim visibility into every
internal validation step. Logs contain fixed labels and HTTP status, never query
parameters, challenge XDR, signatures, response bodies or JWTs.

[auth-activity.ts](src/setup/auth-activity.ts) supplies the forwarding fetch
callback. WebAuth 1.1.0 stores that callback on its transport; forwarding
preserves the Window receiver required by native browser fetch. Each mounted
lesson has a distinct discovery scope so a cached client cannot retain another
page's log callback. The actual Colibri hooks remain directly in the lesson
files.

### If discovery fails

`SEP1_001` with `Failed to fetch` means the browser could not read stellar.toml;
it is not an authentication rejection. The page now shows the service address
and recovery commands. From `examples/web`, restart `deno task dev` or
`deno task preview`, or start `deno task auth` separately. Check that terminal
for startup/port errors, then click Discover or Refresh discovery again. After
restarting the fixture, refresh discovery to read its new server signing key.

Use the demo on `http://127.0.0.1:5173` / `:4173`, or the equivalent `localhost`
origins. These are the only browser origins accepted by the fixture. A built
static site alone does not include the auth server; local preview supplies it. A
remote deployment needs its own HTTPS authentication service/configuration.

The current Colibri SEP-10 client requires a full keypair signer. The Kit's
transaction adapter does **not** satisfy that interface, so the lesson uses its
own explicit practice connector. SEP-45 is a separate contract-account flow; see
the existing [WebAuth CLI examples](../webauth/README.md).

This server is a local protocol fixture, not a production authentication
service. It binds only to loopback, accepts this app's fixed dev/preview
origins, and has no persistent signing keys, revocation service, production JWT
audience policy or TLS deployment. Restart it to rotate its key; reload client
discovery afterward. HTTP is permitted only for this fixed local development
domain in the app.

## Hook-to-lesson map

Source stays in these independent files; the app displays explanations rather
than snippets. Search the sidebar by hook name. Related connection primitives
share a lesson; convenience and granular transaction/client variants remain
independent.

| Lesson/source                                                    | Hooks                                                  | Expected result                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| [Network/provider](src/examples/network/overview.tsx)            | useColibriConfig, useNetwork, useRpc, useLatestLedger  | Live ledger and authoritative network         |
| [Wallet](src/examples/wallets/wallet.tsx)                        | useWallet                                              | Connect/disconnect through the Kit            |
| [Connection](src/examples/wallets/connection.tsx)                | useConnection, useConnect, useReconnect, useDisconnect | Explicit lifecycle and silent restore         |
| [Direct Freighter](src/examples/wallets/freighter.tsx)           | useConnect, useConnection, useDisconnect               | Independent extension adapter                 |
| [Signers](src/examples/signing/signers.tsx)                      | useSigners                                             | Explicit capability list                      |
| [Message](src/examples/signing/message.tsx)                      | useSignMessage                                         | Separate SEP-53 signing and verification      |
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
[wallet connectivity guide](src/examples/wallets/ecosystem.tsx).

## Structure and dependency boundaries

- `src/app/`: application shell, catalog, stable provider and styling.
- `src/examples/<context>/`: independent instructional components. SDK actions
  stay visible here; there is no shared execution runner.
- `src/setup/`: network, wallet adapters and optional public fixture
  identifiers.
- `src/components/`: presentation and exact amount formatting.
- `src/generated/`: ignored, reproducible counter bindings.
- `scripts/`: offline generation and optional Testnet provisioning.
- `auth-server/`: loopback SEP-10 fixture, Vite lifecycle integration and
  standalone entry point.

The web app owns its `deno.json` imports, tasks, compiler options and
`deno.lock`. Root CLI dependency versions are unchanged. The Deno Vite plugin
uses that same import map for browser builds. `.npmrc` only identifies the JSR
npm registry; dependency versions all live in `deno.json`. Runnable lessons load
on demand by route; the wallet SDK remains an application-owned dependency. The
native Stellar SDK remains a substantial shared browser dependency.

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
