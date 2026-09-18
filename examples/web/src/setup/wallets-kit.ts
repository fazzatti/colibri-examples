/**
 * Register the app's primary Wallets Kit integration and signing policy.
 *
 * This browser-only module initializes the installed Kit with Freighter and
 * Testnet, then adapts it to Colibri's general connector contract. The Kit owns
 * selection/prompts; app/provider.tsx registers the resulting connector.
 * Capabilities are chosen per wallet module: envelope/auth-entry signing uses
 * Colibri's signer adapter, while wallet-message-signer.ts adapts SEP-53.
 * Adding another Kit module requires reviewing and declaring its own support,
 * rather than assuming every module implements every Kit method.
 *
 * @module
 */
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  FREIGHTER_ID,
  FreighterModule,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { createStellarWalletsKitConnector } from "@colibri/react/ecosystem/stellar-wallets-kit";
import { createWalletMessageSigner } from "./wallet-message-signer.ts";
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
    capabilities: (account) => ({
      // Freighter supports envelope and G-account authorization-entry signing.
      // Colibri adapts both; the Kit still owns wallet selection and prompts.
      signer: account.module.productId === FREIGHTER_ID
        ? createWalletSigner
        : undefined,
      messageSigner: account.module.productId === FREIGHTER_ID
        ? createWalletMessageSigner(StellarWalletsKit, account)
        : undefined,
    }),
  },
);
