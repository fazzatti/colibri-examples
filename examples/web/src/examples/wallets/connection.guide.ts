import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Use the separate connection hooks to distinguish observing connection state from performing an action.",
  "steps": [
    "Connect calls useConnect with the Kit connector ID and opens the wallet picker. Approve access to see useConnection update.",
    "Reconnect silently calls useReconnect without a picker. It restores an identity only when the connector already has one available; otherwise the page reports nothing to restore.",
    "Disconnect calls useDisconnect and clears the active identity. The state observer updates without making another connection request.",
  ],
  "outcome":
    "Status and address reflect the latest provider state. Silent reconnect is allowed to return no identity; use Connect when consent or wallet selection is needed.",
  "docs": [
    {
      "label": "Connection lifecycle",
      "path": "colibri-react/wallets-and-sessions",
    },
  ],
} satisfies LessonGuide;
