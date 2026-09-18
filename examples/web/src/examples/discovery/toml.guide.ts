import type { LessonGuide } from "../../components/guide-panel.tsx";

export default {
  "purpose":
    "Discover the local service’s SEP-1 configuration before using its advertised authentication endpoint.",
  "steps": [
    "Run deno task auth from examples/web in a second terminal.",
    "Click Discover local stellar.toml to request the displayed loopback URL. The read is disabled until you click.",
    "Inspect the advertised Testnet passphrase and raw declarations. Click again to refresh them.",
  ],
  "outcome":
    "The response describes the local service. HTTP is enabled only for the loopback demo; discovery itself does not sign in or invoke the service.",
  "docs": [],
} satisfies LessonGuide;
