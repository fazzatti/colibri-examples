import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Observe an existing transaction hash until it reaches a terminal RPC status.",
  "steps": [
    "Enter a valid Testnet transaction hash and click Start waiting. This only enables observation.",
    "While the result is NOT_FOUND, useWaitForTransaction polls every second. SUCCESS or FAILED stops its polling.",
    "Click Stop waiting to disable observation yourself, or leave the page. Neither action submits or cancels the transaction.",
  ],
  "outcome":
    "The RPC response provides the observed status. An unknown hash can remain NOT_FOUND, so use the stop control when finished.",
  "docs": [],
} satisfies LessonGuide;
