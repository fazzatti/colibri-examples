import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Read a SEP-41 token’s metadata and balance by contract ID, including Stellar Asset Contracts.",
  "steps": [
    "Keep the default Testnet native XLM SAC, or enter another Testnet SEP-41 token C-address.",
    "Enter the balance owner as a G-address or C-address. Metadata loads for a valid token ID; the balance also needs a valid owner.",
    "Compare the two query results: useTokenMetadata provides name/symbol/decimals, while useBalance supplies the owner’s raw amount and precision.",
  ],
  "outcome":
    "The amount uses the token’s declared decimals. A custom SEP-41 token is not necessarily a Classic issued asset; the default SAC bridges native XLM.",
  "docs": [],
} satisfies LessonGuide;
