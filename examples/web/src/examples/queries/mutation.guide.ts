import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Wrap a Testnet Friendbot funding action in mutation state and refresh the matching balance after success.",
  "steps": [
    "Enter a disposable Testnet G-address. The balance query may initially report that the unfunded account does not exist.",
    "Click Request Testnet funding. useColibriMutation runs the explicit Friendbot action once and reports its lifecycle.",
    "After RPC can see the funded account, the success callback invalidates its exact XLM balance query.",
  ],
  "outcome":
    "The balance refreshes when funding succeeds. Friendbot can reject funded accounts or rate-limit requests; failed actions are not retried automatically.",
  "docs": [
    {
      "label": "Mutation policy and invalidation",
      "path": "colibri-react/queries",
    },
  ],
} satisfies LessonGuide;
