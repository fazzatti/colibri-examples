import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Connect a Testnet wallet through Wallets Kit using the combined useWallet hook, then observe and release that connection.",
  "steps": [
    "Install Freighter and select Testnet. Click Connect with Wallets Kit, select Freighter and approve access in the extension.",
    "Read the connection status, account, connector ID and signer count returned by useWallet. The provider keeps the connection as you navigate.",
    "If REACT_007 appears, the wallet reports a different network. Switch the wallet to Testnet and click Connect again.",
    "Click Disconnect to release Colibri’s connection. This does not remove the account or revoke the extension’s site permission.",
  ],
  "outcome":
    "A successful connection reports connected and a G-address. Disconnect returns to disconnected and removes the address and signer capabilities.",
  "docs": [
    {
      "label": "Wallet connectors and network checks",
      "path": "colibri-react/wallets-and-sessions",
    },
    {
      "label": "React error reference",
      "path": "reference/errors/react",
    },
  ],
} satisfies LessonGuide;
