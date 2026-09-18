/**
 * Own the external-wallet configuration shared by this browser application.
 *
 * The app mounts this provider around the active lesson and header. Navigation
 * therefore retains one Testnet configuration, external-wallet connection and
 * query cache. Both connector IDs come from the setup modules below.
 * Signer-dependent lessons nest setup/signer-provider.tsx to select this wallet
 * or a separately owned local key. Hot-module cleanup releases connection
 * listeners when Vite replaces this configuration during development.
 *
 * @module
 */
import { createColibriConfig } from "@colibri/react";
import { ColibriQueryProvider } from "@colibri/react/provider";
import type { PropsWithChildren } from "react";
import { network } from "../setup/network.ts";
import { walletsKitConnector } from "../setup/wallets-kit.ts";
import { freighterConnector } from "../setup/freighter.ts";

// One browser application owns one configuration. Navigation replaces only
// the lesson, retaining its wallet connection and network-scoped query cache.
const config = createColibriConfig({
  network,
  connectors: [walletsKitConnector, freighterConnector],
});

export function Provider({ children }: PropsWithChildren) {
  return <ColibriQueryProvider config={config}>{children}
  </ColibriQueryProvider>;
}

// Release connection listeners when Vite replaces this module in development.
if (import.meta.hot) import.meta.hot.dispose(() => config.destroy());
