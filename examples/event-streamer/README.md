# Event Streamer Example

This example demonstrates how to use the [@colibri/event-streamer](https://jsr.io/@colibri/event-streamer) package to ingest Soroban contract events from the Stellar network in both live and archival modes.

## Overview

The example includes two ingestion scripts:

- **Live Ingestion** - Streams events in real-time from the latest ledgers
- **Archive Ingestion** - Fetches historical events from past ledgers outside the normal RPC retention window

## Usage

Before proceeding, make sure to follow the setup described in the [workspace README](../README.md).

### Live Ingestion

Streams XLM transfer events from the Stellar Mainnet for the next 5 ledgers:

```bash
deno task ingest:live
```

This script:

1. Connects to the Stellar Mainnet via Lightsail's public RPC
2. Sets up a filter for `transfer` events from the XLM contract
3. Ingests events from the latest ledger until 5 ledgers have passed
4. Logs each event's details (ledger, transaction hash, topics, and value)

### Archive Ingestion

Fetches historical KALE mint events from a specific past ledger:

```bash
deno task ingest:archive
```

This script:

1. Connects to the Stellar Mainnet via Lightsail's public RPC (with archival support)
2. Sets up a filter for `mint` events from the KALE contract
3. Ingests events from ledger `59895694` (contains 9 KALE mint events)
4. Logs each event's details

**Other Configuration:**
If you'd like to try some other event types try ingesting one of the ledgers below:

- `60044284`: Contains events for the native XLM involving Liquidity pool transfers and receivers with muxed addresses.

## Key Concepts

### EventFilter

Filters allow you to specify which events to capture:

```ts
const filter = new EventFilter({
  contractIds: ["CONTRACT_ID"],
  type: EventType.Contract,
  topics: [[xdr.ScVal.scvSymbol("event_name"), "**"]],
});
```

- `contractIds` - Array of contract IDs to monitor
- `type` - Event type (e.g., `EventType.Contract`)
- `topics` - Topic filters with wildcard support (`**` matches any remaining topics)

### EventStreamer

The main class for ingesting events:

```ts
const eventStreamer = new EventStreamer({
  rpcUrl: networkConfig.rpcUrl,
  archiveRpcUrl: networkConfig.archiveRpcUrl,
  filters: [filter],
  options: {
    waitLedgerIntervalMs: 5000,
    pagingIntervalMs: 500,
  },
});
```

### Ingestion Modes

- **Live mode** - Used when `startLedger` is within the RPC retention window (or omitted)
- **Archive mode** - Automatically used when `startLedger` is outside the retention window

The `start()` method intelligently switches between modes as needed.

## Learn More

- [@colibri/event-streamer on JSR](https://jsr.io/@colibri/event-streamer)
- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
