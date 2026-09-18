import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read the GUIDE trustline for a specific account and issuer, including its balance and trustline settings.",
  "steps": [
    "Run deno task setup to create the GUIDE fixture, or enter an account that trusts your chosen GUIDE issuer.",
    "The read starts automatically when both G-addresses are valid. GUIDE plus its issuer identifies the asset.",
    "Inspect the formatted balance and expand Returned data to see limit and authorization flags.",
  ],
  "outcome":
    "The fixture initially holds 25 GUIDE. An absent trustline is reported as an error; another issuer’s GUIDE is a different asset.",
  "docs": [
    {
      "label": "Classic asset identity",
      "path": "colibri-core/asset",
    },
  ],
} satisfies LessonGuide;
