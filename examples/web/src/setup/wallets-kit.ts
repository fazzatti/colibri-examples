import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  FREIGHTER_ID,
  FreighterModule,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { createStellarWalletsKitConnector } from "@colibri/react/ecosystem/stellar-wallets-kit";
import { createWalletSigner } from "@colibri/react/wallets/signer";

// The application chooses modules and initializes the browser-only Kit once.
// Freighter is the deliberately small starting set. Add other modules here
// with their own capability policy instead of assuming they all sign alike.
StellarWalletsKit.init({
  modules: [new FreighterModule()],
  network: Networks.TESTNET,
});

export const walletsKitConnector = createStellarWalletsKitConnector(
  StellarWalletsKit,
  {
    capabilities: ({ module }) => ({
      // Freighter supports envelope and G-account authorization-entry signing.
      // Colibri adapts both; the Kit still owns wallet selection and prompts.
      signer: module.productId === FREIGHTER_ID
        ? createWalletSigner
        : undefined,
    }),
  },
);
