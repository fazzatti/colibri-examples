import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read getCount through the generated Counter client and observe the result as a React query.",
  "steps": [
    "Prepare the counter with deno task setup and restart the app if fixture identifiers changed.",
    "On entry, useContractRead calls the client’s getCount read helper. Read count again requests a fresh simulation.",
    "Inspect Stored count and the query status. No wallet is needed for this public read.",
  ],
  "outcome":
    "The returned count reflects the simulation result. Reading does not submit a transaction or commit any state changes.",
  "docs": [
    {
      "label": "Contract reads and invocations",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
