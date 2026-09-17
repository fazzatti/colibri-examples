import * as freighter from "@stellar/freighter-api";
import { createFreighterConnector } from "@colibri/react/ecosystem/freighter";

// An independent path for applications that already use Freighter directly.
// This adapter exposes envelope signing and observes account/network changes.
// It does not inherit the additional capabilities of the Wallets Kit adapter.
export const freighterConnector = createFreighterConnector(freighter);
