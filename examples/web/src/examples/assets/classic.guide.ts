import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read a Classic issued-asset balance by code and issuer through its trustline.",
  "steps": [
    "Run deno task setup or supply an account with a GUIDE trustline.",
    "Enter the account and GUIDE issuer G-addresses. Valid inputs start the read automatically.",
    "Compare the formatted GUIDE amount with raw units and decimals in Returned data.",
  ],
  "outcome":
    "Classic balances have seven decimal places. An asset code alone is insufficient, and a missing trustline is reported separately from a zero balance.",
  "docs": [],
} satisfies LessonGuide;
