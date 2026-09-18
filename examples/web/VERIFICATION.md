# Browser verification checklist

From `examples/web`, use `deno task install`, `deno task setup`,
`deno task dev`. Dev and preview start the local auth fixture automatically.
Also build and repeat the smoke checks with `deno task preview`. Verify both the
127.0.0.1 and localhost origins on the documented ports. `deno task auth`
remains available to run the fixture separately.

These checks are manual behavior checks, in keeping with the repository's
learning-example convention. They are not a replacement for Colibri's own
library tests, and a successful local signer flow does not prove a browser
extension integration.

## Navigation and reading

- Open every sidebar lesson and a direct `/#contract-read` URL. Each must show
  its task, steps, expected result, hook explanations and specific Colibri
  links. No source/snippet panels, fabricated logo or slogans should remain.
- Follow Next through all 29 lessons, then Previous. The first/last pages have
  no out-of-range navigation; sidebar search does not change the sequence.
- The ledger loads once by default. Enable automatic refresh: the countdown
  decreases, a spinner marks fetching, and the next wait starts after
  completion. Disable it and verify that the last-read time stops changing.
  Manual refresh still works; leaving and returning starts with auto-refresh
  off.
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
- Connect on another network: REACT_007 must explain that this demo uses
  Testnet, ask to switch the wallet network, and instruct the user to reconnect.
- Connect on Testnet; navigate to another lesson without losing the connection.
- Switch to a different wallet network/account; stale authority must clear.
- Return to Testnet and reconnect explicitly. A silent reconnect may return
  null.
- Compare Kit's combined signer and direct Freighter's envelope-only capability.
- Connect from the header on a transaction page and fund the account there.
  Submission must be disabled until its account check succeeds. Reject a
  signature and confirm a visible error with no automatic retry; approve a fresh
  1 XLM payment.
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

The **Invoke with signers** lesson can exercise a real Testnet transaction
without an extension. Its local signer cannot validate wallet-derived
invocation, extension prompts, rejection or wallet network-change notifications.
Record those checks separately.

## Signer choices, setup and isolation

- Open each signer-dependent page directly. Both source choices are visible;
  wallet choice is disabled without a compatible connection. There is no default
  hidden signer and no automatic wallet prompt.
- Keep each page open while connecting from the header. The choice shows
  Connecting wallet, then enables Use connected wallet if compatible. Repeat
  with a local signer already selected: its address and results must survive
  connecting/disconnecting the header wallet until an explicit source change.
- Select the wallet: the button reads Using connected wallet. Disconnect and
  reconnect without reloading; the choice and selected address follow the live
  connection. Account and capability changes must update the current step too.
- On Authenticate & log out, connecting Kit changes the disabled button to
  Wallet unavailable for this step with a connected-but-incompatible SEP-10
  explanation. This differs from the initial disconnected state. On Sign and
  verify a message, direct Freighter explains its missing SEP-53 capability,
  while Kit/Freighter enables the choice.
- Create local signer. The selected address differs from the header wallet, and
  transaction submission stays disabled until funding/account checks succeed.
  Fund with Friendbot, then invoke successfully; the read increases by one.
- With an extension connected, choose Use connected wallet. The displayed source
  must match the header. Complete the same operation with a wallet approval.
  Switch back to local and verify that the wallet stays connected.
- Change source after a result: the previous receipt/signature/session and form
  clear. Choice buttons are disabled during signing/submission. Disconnect or
  change the wallet account/network: old authority must not remain usable.
- Leave/revisit: no local key survives. Navigate while funding is pending and
  return: old completion must not enable the new instance. Retry failed funding:
  the selected address must be retained.
- Wallets Kit with Freighter can sign a SEP-53 message. Direct Freighter remains
  envelope-only and shows why message signing is unavailable. Missing
  capability, wrong returned account, invalid signature and
  account/network/module changes must fail without claiming success.
- SEP-10 explains its synchronous raw-key requirement and disables Kit/direct
  Freighter selection. Create a local signer and authenticate directly without
  first visiting discovery/message signing. Header wallet remains unchanged.
- Classic payment: generate/fund a recipient here; both source and recipient
  checks gate Send. Invalid or missing addresses never enable submission.

## Messages and authentication

- Create a local signer and sign a message. The signature is 128 hex characters
  and the separate verification fields fill automatically, with no verification
  result yet. Copy/paste must preserve the signature.
- Verify the filled values: valid. Change the verification message: the old
  result clears; Verify reports invalid. Malformed hex/public-key inputs show an
  error. Restore the original values: valid again. Verify an empty message and
  independently pasted values without a wallet connection too.
- Start dev/preview with no server on8787: the fixture starts automatically.
  Start the other Vite mode while it is running: it reuses the fixture and does
  not stop it on exit. An unrelated service on8787 fails startup clearly.
- Discover local stellar.toml and WebAuth; both report Testnet. Activity records
  the actual request, HTTP200 and validated result. Clear empties the log;
  another request repopulates it. Entries are bounded to20 and do not leak
  between mounted lessons or signer choices.
- Authenticate a local signer through SEP-10: display account and expiry,
  without rendering a JWT or saving one in browser storage. Activity shows GET
  challenge, POST signed challenge and authenticated state in that order. No
  query parameters, XDR, signatures, response payloads or tokens appear in logs.
- Logout, reconnect/change identity, disconnect and wait two minutes for expiry:
  each applicable transition returns the session to anonymous.
- Leave and re-enter the session lesson: the owned old session is destroyed.
- Server checks: a replayed challenge, unsigned challenge, wrong signer, expired
  challenge and disallowed browser Origin must be rejected.
- With the frontend still running, stop a separately owned auth fixture and
  retry discovery: show an actionable service/restart error and retained failed
  request. Restore the service and retry without a page reload. No automatic
  retry loop should run. Refresh discovery to pick up the new signing key.
- Force an HTTP error and a malformed challenge response: activity must show
  failure and must not claim an authenticated session or completed signing.
- Logout, disconnect and expiry update Activity. Navigating away clears it; no
  delayed request should populate another page's log.

## Reproducibility

- Fresh install regenerates ignored bindings from the existing Wasm, offline.
- `check` and `build` pass; `deno info src/app/provider.tsx` shows one resolved
  version of React and Query. Check the production app, not only Vite
  development.
- Root CLI `check` and `lint` still use their own dependency scope.
- No `.env.local`, generated clients, private keys or build output enters Git.
