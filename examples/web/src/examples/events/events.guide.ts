import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Subscribe to the counter’s events and see how the hook manages the observer lifecycle.",
  "steps": [
    "Prepare the counter fixture. This page starts observing automatically at the latest ledger and retains at most 25 events.",
    "Open the invocation example in another tab and submit an increment. Return here to inspect the event’s ledger, topics, value and transaction hash.",
    "Stop observing releases the observer. Start observing opens a new live window; Restart stream restarts the current subscription.",
  ],
  "outcome":
    "A committed counter increment emits an event. Leaving the page stops this observer; this example does not load all historical events.",
  "docs": [
    {
      "label": "Event store and observation",
      "path": "colibri-react/contracts-and-transactions",
    },
  ],
} satisfies LessonGuide;
