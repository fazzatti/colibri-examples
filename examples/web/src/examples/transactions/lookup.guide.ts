import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Look up the RPC result for an existing transaction without submitting it again.",
  "steps": [
    "Paste a recent Testnet transaction hash, or arrive through a completed action’s transaction link. A valid 64-character hex hash starts the query automatically.",
    "Inspect RPC status and Returned data. Refresh transaction requests the status again.",
    "Use Wait for confirmation to move to controlled polling of this hash.",
  ],
  "outcome":
    "RPC can return SUCCESS, FAILED or NOT_FOUND. NOT_FOUND can mean pending, unknown or outside retention; it does not prove failure.",
  "docs": [],
} satisfies LessonGuide;
