import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Render an address as an identicon with the hook and the convenience component.",
  "steps": [
    "Enter a valid G-address or C-address. No funded account or wallet connection is required.",
    "Compare the image from useIdenticon’s SVG data URL with AccountIdenticon for the same address.",
    "Change the address to see both images update locally.",
  ],
  "outcome":
    "Both renderings identify the same input visually. G-addresses follow SEP-33; C-address support is a Colibri extension. An identicon is not proof of ownership.",
  "docs": [],
} satisfies LessonGuide;
