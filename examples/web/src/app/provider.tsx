import { createColibriConfig } from "@colibri/react";
import { ColibriQueryProvider } from "@colibri/react/provider";
import type { PropsWithChildren } from "react";
import { network } from "../setup/network.ts";
import { walletsKitConnector } from "../setup/wallets-kit.ts";
import { freighterConnector } from "../setup/freighter.ts";
import { practiceConnector } from "../setup/practice-identity.ts";

// One browser application owns one configuration. Navigation replaces only
// the lesson, retaining its wallet connection and network-scoped query cache.
const config = createColibriConfig({
  network,
  connectors: [walletsKitConnector, freighterConnector, practiceConnector],
});

export function Provider({ children }: PropsWithChildren) {
  return <ColibriQueryProvider config={config}>{children}
  </ColibriQueryProvider>;
}

// Release connection listeners when Vite replaces this module in development.
if (import.meta.hot) import.meta.hot.dispose(() => config.destroy());
