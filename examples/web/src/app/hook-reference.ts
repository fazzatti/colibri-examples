export const hookDescriptions = {
  "useColibriConfig":
    "Returns the configuration held by the provider, including its network and cache scope. It does not open a wallet or make a request.",
  "useNetwork":
    "Returns the configured network passphrase and service URLs. Every transaction in this application uses this Testnet configuration.",
  "useRpc":
    "Returns a memoized RPC client for the provider’s endpoint. Creating the client does not itself make a network request.",
  "useLatestLedger":
    "Queries the RPC server for its latest ledger. The result provides data, loading/error state and refetch(); polling is enabled by the application, not required by the hook.",
  "useWallet":
    "Combines connection state, address, connector ID, guarded signers and connect/disconnect actions in one hook. Connecting exposes capabilities; signing still requires a separate action.",
  "useConnection":
    "Observes the provider connection without opening a wallet. Status and address update when connection state changes.",
  "useConnect":
    "Returns an action that connects through a named connector. Call it from a user action; here it opens the Wallets Kit picker.",
  "useReconnect":
    "Returns an action that asks the connector to restore an available identity without opening a prompt. A null result means there is nothing to restore.",
  "useDisconnect":
    "Returns an action that releases the current Colibri connection and its signing authority. It does not revoke the wallet extension’s website permission.",
  "useSigners":
    "Returns the signing capabilities advertised by the active connection. The returned signers are guarded against use after an account or network change.",
  "useSignMessage":
    "Signs a supplied message through the connection’s optional messageSigner capability and returns signature bytes. This mutation neither submits a transaction nor verifies the signature.",
  "useAccount":
    "Reads a Stellar account through RPC and exposes its ledger data as query state. An undefined address disables automatic fetching.",
  "useTrustline":
    "Reads the trustline identified by the account and Classic asset. Its data includes balance, limit and authorization flags; a missing trustline is an error.",
  "useLedgerEntries":
    "Returns a stable ledger reader with helpers for known ledger keys. It is not itself a query result; this lesson wraps its account() read in a TanStack query.",
  "useBalance":
    "Reads an asset balance using an explicit asset identity: native XLM, Classic code/issuer, or SEP-41 contract ID. It returns raw bigint units and decimal precision for display.",
  "useTokenMetadata":
    "Queries a SEP-41 contract for its name, symbol and decimals. Token precision is read from the contract and shared with balance queries.",
  "useContract":
    "Keeps a Core Contract instance or generated subclass stable while its dependency list is unchanged. This preserves the instance and its configured pipelines across rerenders.",
  "useContractRead":
    "Calls a typed read helper on an existing contract client and exposes the result as query state. The underlying simulation does not commit ledger changes.",
  "useContractReadSpec":
    "Reads a contract using its ID, ABI spec and exact ABI method name, without a full client. A separate decoder checks the returned value for this observer.",
  "useContractInvoke":
    "Runs a contract invocation with explicitly supplied source, signers and transaction configuration. Mutation state covers the complete operation; successful writes need explicit query refresh.",
  "useWalletContractInvoke":
    "Invokes a contract using the current connection’s source and guarded signers. The application still supplies method arguments, fees and timeout.",
  "useClassicTransaction":
    "Runs Colibri’s Classic transaction pipeline with native Stellar operations and explicit transaction settings. It builds, signs, submits and returns the result.",
  "useSimulateSorobanTransaction":
    "Simulates a prepared native Soroban transaction and exposes the RPC result as mutation state. It does not sign, submit or commit the simulated operation.",
  "useSorobanTransaction":
    "Runs the Soroban pipeline for native operations: build, simulate, authorize, assemble, sign and submit. Source and signer configuration are supplied explicitly here.",
  "useTransaction":
    "Looks up an existing transaction hash through RPC. It observes the result without signing or submitting a transaction.",
  "useWaitForTransaction":
    "Polls a transaction hash until RPC returns SUCCESS or FAILED. Observation can be disabled; NOT_FOUND alone does not establish a failed submission.",
  "useContractEvents":
    "Observes a shared contract event store. The first observer starts it; removing the final observer stops the network work.",
  "useStellarToml":
    "Discovers and parses a domain’s SEP-1 stellar.toml configuration. Declared endpoints describe services; discovery does not execute them.",
  "useIdenticon":
    "Creates a deterministic SVG data URL from an address locally. No RPC request or wallet connection is needed.",
  "useColibriMutation":
    "Wraps an application action with Colibri’s pending/error/success state and scoped serial mutation queue. It never retries the action automatically.",
  "useWebAuthClient":
    "Discovers a domain’s authentication configuration and prepares a WebAuth client. Discovery does not authenticate the user or create a session.",
  "useWebAuth":
    "Runs authentication through a shared session: obtain and validate the challenge, request a signature, and exchange it with the service.",
  "useSession":
    "Observes a shared WebAuth session’s status and authentication metadata. Logout, connection changes and expiry clear that session.",
} as const;

export const docsBase = "https://fifo-docs.gitbook.io/colibri";

export function hookDocumentation(name: string) {
  const slug = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `${docsBase}/colibri-react/hooks/${slug}`;
}
