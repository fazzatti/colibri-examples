/**
 * Register the direct Freighter alternative to the Wallets Kit integration.
 *
 * Pass the installed upstream API into Colibri's createFreighterConnector,
 * then register this connector in app/provider.tsx. The freighter.tsx lesson
 * selects it by ID. It declares envelope signing and observes authorized
 * account/network changes; the separate Kit connector's message/auth-entry
 * capabilities are not inherited. Importing this adapter does not request
 * permission or open a signing prompt.
 *
 * @module
 */
import * as freighter from "@stellar/freighter-api";
import { createFreighterConnector } from "@colibri/react/ecosystem/freighter";

// An independent path for applications that already use Freighter directly.
// This adapter exposes envelope signing and observes account/network changes.
// It does not inherit the additional capabilities of the Wallets Kit adapter.
export const freighterConnector = createFreighterConnector(freighter);
