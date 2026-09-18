import { Note } from "../../components/lesson.tsx";

export default function WalletConnectivity() {
  return (
    <>
      <Note>
        The app owns the wallet SDK. Colibri owns its provider, connection
        guards and transaction pipelines. The wallet owns approval and keys.
      </Note>
      <div className="steps">
        <h3>Choose a wallet SDK</h3>
        <p>
          Wallets Kit provides selection UI and wallet modules. This app starts
          with its Freighter module; install the Freighter extension and select
          Testnet. Add modules in <code>src/setup/wallets-kit.ts</code>{" "}
          after reviewing each module's capabilities and setup requirements.
        </p>
        <h3>Declare capabilities</h3>
        <p>
          <code>createStellarWalletsKitConnector</code>{" "}
          converts the Kit's identity and explicitly selected signing
          capabilities into Colibri's general <code>WalletConnector</code>{" "}
          contract. Here, <code>createWalletSigner</code>{" "}
          enables envelope and G-account authorization-entry signing for
          Freighter. A method existing on the Kit does not prove every module
          supports it.
        </p>
        <h3>Provide the connection</h3>
        <p>
          <code>ColibriQueryProvider</code>{" "}
          holds the network, connectors and query cache. <code>useWallet</code>
          {" "}
          reads that state. Colibri verifies the wallet's actual network
          passphrase against Testnet, and clears stale signing authority when
          identity changes.
        </p>
        <h3>Let the user act</h3>
        <p>
          Connect opens the Kit. A transaction button invokes a Colibri
          pipeline; the wallet signs after approval, then the pipeline submits
          through RPC. A successful connection alone does not approve future
          signatures.
        </p>
      </div>
      <h3>Three visible integration paths</h3>
      <table>
        <thead>
          <tr>
            <th>Path</th>
            <th>What it teaches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Wallets Kit</td>
            <td>
              Primary integration: selection UI and explicit per-module
              capabilities.
            </td>
          </tr>
          <tr>
            <td>Direct Freighter</td>
            <td>
              A single-wallet application using the upstream API directly.
              Envelope signing only in this adapter.
            </td>
          </tr>
          <tr>
            <td>Practice identity</td>
            <td>
              A general connector holding a disposable key in memory for SEP-53
              and SEP-10 lessons. No extension, persistence or real funds.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        For another wallet or smart account, implement{" "}
        <code>createWalletConnector</code>{" "}
        with connect, optional silent reconnect, disconnect and change
        subscriptions. Account availability, transaction signing,
        authorization-entry signing and message signing are separate
        capabilities.
      </p>
      <p>
        The current SEP-10 client needs a complete keypair signer. This example
        uses a practice identity there; it does not claim the Kit's envelope
        adapter satisfies that interface. SEP-45 contract-account authentication
        needs a separate authorization policy and is outside this example.
      </p>
      <p>
        <a
          href="https://stellarwalletskit.dev/kit-structure.html"
          target="_blank"
          rel="noreferrer"
        >
          Wallets Kit structure ↗
        </a>{" "}
        ·{" "}
        <a
          href="https://jsr.io/@colibri/react/doc/ecosystem/stellar-wallets-kit"
          target="_blank"
          rel="noreferrer"
        >
          Colibri adapter API ↗
        </a>
      </p>
    </>
  );
}
