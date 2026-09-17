import { NetworkConfig } from "@colibri/core/network";

// Every provider, transaction and fixture in this application uses Testnet.
// Wallets must report this same passphrase; an endpoint label is not enough.
export const network = NetworkConfig.TestNet();
