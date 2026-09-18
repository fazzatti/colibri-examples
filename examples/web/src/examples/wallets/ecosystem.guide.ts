import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Understand the roles of the wallet SDK, Colibri connector and React provider before connecting a wallet.",
  "steps": [
    "Install Freighter and select Testnet in its network settings. This example initializes Wallets Kit with the Freighter module.",
    "The application passes the Kit adapter to createColibriConfig. The adapter exposes the wallet address, actual network and explicitly supported signing methods.",
    "Continue to Connect a wallet to open the picker. A connection supplies identity and capabilities; each transaction still needs its own signing request.",
  ],
  "outcome":
    "You can identify which layer selects the wallet, checks the network and requests a signature. The following examples show the combined hook and then the individual connection actions.",
  "docs": [
    {
      "label": "Wallet connectors and sessions",
      "path": "colibri-react/wallets-and-sessions",
    },
    {
      "label": "Provider setup",
      "path": "colibri-react/setup",
    },
  ],
} satisfies LessonGuide;
