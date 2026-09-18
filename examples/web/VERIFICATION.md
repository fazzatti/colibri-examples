# Browser verification checklist

From `examples/web`, use `deno task install`, `deno task setup`,
`deno task dev`, and a second terminal running `deno task auth`. Also build and
repeat the smoke checks with `deno task preview`. Use the exact 127.0.0.1
origins documented in the README for local authentication.

These checks are manual behavior checks, in keeping with the repository's
learning-example convention. They are not a replacement for Colibri's own
library tests, and a successful local signer flow does not prove a browser
extension integration.

## Navigation and reading

- Open every sidebar lesson and a direct `/#contract-read` URL. The source panel
  must show the matching TSX file, and its provider/adapter tabs must work.
- Search `useReconnect` and confirm Connection primitives is discoverable.
- Navigate with keyboard focus and the skip link. At 390px width, open/close
  Examples, select a lesson, and confirm no page-level horizontal overflow.
- Observe a live ledger. Read the fixture account, 25 GUIDE trustline, Classic
  balance, and native XLM SAC metadata/balance. Compare exact amounts.
- Enter an invalid address: no request should run. Enter a valid unfunded
  G-address: show a missing-account error rather than zero.
- Unplug/restore network access and refresh: loading/error/recovery stay
  visible.
- Rerender the full-client lesson: its generated client remains the same
  instance.

## Wallets and transactions

Use a disposable **Testnet** account in the real Freighter extension:

- Open/cancel Wallets Kit; the app must remain usable and disconnected.
- Connect on Testnet; navigate to another lesson without losing the connection.
- Switch to a different wallet network/account; stale authority must clear.
- Return to Testnet and reconnect explicitly. A silent reconnect may return
  null.
- Compare Kit's combined signer and direct Freighter's envelope-only capability.
- Fund the connected account through Compose an action. Reject a signature and
  confirm a visible error with no automatic retry; approve a fresh 1 XLM
  payment.
- Follow the hash: lookup and confirmation must report the actual RPC result.
- Start confirmation for an unknown hash, then stop it; NOT_FOUND is not
  failure.
- Simulate increment(+1), then refresh the read: stored count must be unchanged.
- Invoke with explicit signers, wallet-derived config, and the Soroban pipeline:
  each commits +1 and displays its real receipt. The explicit invoke refreshes
  the matching read query after success.
- With Events open in another tab, invoke again and inspect its
  ledger/hash/data. Stop/restart observing and navigate away; the retained
  window is bounded at 25.

The practice identity can exercise real signing and Testnet pipeline calls
without an extension, but cannot validate extension prompts, rejection or wallet
network-change notifications. Record those checks separately.

## Messages and authentication

- Create a practice identity and sign a message. SEP-53 verification succeeds.
  Editing the input clears the displayed verification for the previous message.
- Discover local stellar.toml and WebAuth; both report Testnet.
- Authenticate a practice identity through SEP-10: display account and expiry,
  without rendering a JWT or saving one in browser storage.
- Logout, reconnect/change identity, disconnect and wait two minutes for expiry:
  each applicable transition returns the session to anonymous.
- Leave and re-enter the session lesson: the owned old session is destroyed.
- Server checks: a replayed challenge, unsigned challenge, wrong signer, expired
  challenge and disallowed browser Origin must be rejected.
- Stop the auth server and retry discovery: show an actionable error. Restart
  and reload discovery to pick up its new signing key.

## Reproducibility

- Fresh install regenerates ignored bindings from the existing Wasm, offline.
- `check` and `build` pass; `deno info src/app/provider.tsx` shows one resolved
  version of React and Query. Check the production app, not only Vite
  development.
- Root CLI `check` and `lint` still use their own dependency scope.
- No `.env.local`, generated clients, private keys or build output enters Git.
