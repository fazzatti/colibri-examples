# Stellar Test Ledger Example

This example demonstrates how to use
[@colibri/test-tooling](https://jsr.io/@colibri/test-tooling) in two modes:

- ephemeral local ledgers for automated integration tests
- reusable local ledgers for interactive experimentation and demos

`StellarTestLedger` is useful because it can spin up pristine Quickstart-based
ledgers on demand, wait until the requested services are ready, and expose the
connection details you need to work with Colibri locally.

## What Is Quickstart?

Stellar Quickstart is the Docker image maintained by the Stellar ecosystem for
running a local or network-connected Stellar environment with common developer
services such as Horizon, Soroban RPC, Friendbot, and optionally Stellar Lab.

`StellarTestLedger` is essentially a programmatic manager for that Quickstart
container lifecycle: it starts the image with the options you choose, waits for
the relevant services to be ready, and gives you the URLs needed to interact
with the running ledger.

If you want the underlying Quickstart details, image flags, and service model,
read the upstream Quickstart documentation:

- [stellar/quickstart GitHub repository](https://github.com/stellar/quickstart)

## Use Case: Automated Testing

The integration test in
[`ledger.integration.test.ts`](./ledger.integration.test.ts) is the disposable,
pristine-ledger flow. It is useful when you want deterministic local integration
tests that create a fresh ledger, run a few transactions, and clean everything
up automatically at the end.

This use case shows how to:

- start a pristine local ledger in `beforeAll`
- turn the exposed service URLs into a Colibri `NetworkConfig`
- initialize accounts with the local Friendbot
- use Colibri's RPC-backed `createClassicTransactionPipeline` helper to send
  transactions
- stop and destroy the container in `afterAll`

The suite includes two transaction tests:

1. A classic payment
2. A classic `setOptions` update

Before running this use case, make sure:

- Docker Desktop, OrbStack, or another reachable Docker daemon is installed and
  running
- you have permission to pull the `stellar/quickstart` image
- you completed the setup described in the [workspace README](../../README.md)

The first run may take a little longer while Docker pulls the Quickstart image.

Run it with:

```bash
deno task test
```

This task:

1. Starts a local Quickstart container programmatically
2. Reads the ledger connection details and turns them into a Colibri
   `NetworkConfig`
3. Uses Friendbot to initialize fresh accounts for each test case
4. Uses Colibri's RPC-backed classic transaction pipeline to submit transactions
5. Stops and destroys the container when the suite finishes

This is the best mode when you want deterministic, isolated, disposable ledgers
for automated testing.

## Use Case: Reusable Ledger

The reusable ledger scripts are the longer-lived flow. They are useful when you
want to keep a local Quickstart container running, inspect it in the browser,
and come back later to submit more transactions or restart the environment.

This use case shows how to:

- start a named ledger and leave it running
- attach to that running ledger later
- submit several transactions against it
- restart the running container
- stop the running container
- expose links for Stellar Lab, the transaction explorer, and local ledger meta

Before running this use case, make sure:

- Docker Desktop, OrbStack, or another reachable Docker daemon is installed and
  running
- you have permission to pull the `stellar/quickstart` image
- you completed the setup described in the [workspace README](../../README.md)

The first run may take a little longer while Docker pulls the Quickstart image.

The reusable ledger is configured like this:

```ts
const ledger = new StellarTestLedger({
  containerName: "colibri-stellar-test-ledger-reusable",
  containerImageVersion: QuickstartImageTags.LATEST,
  enabledServices: [
    QuickstartServices.CORE,
    QuickstartServices.HORIZON,
    QuickstartServices.RPC,
    QuickstartServices.LAB,
    QuickstartServices.GALEXIE,
  ] as const,
});

await ledger.start();
const networkDetails = await ledger.getNetworkDetails();
```

### Step 1: Start The Reusable Ledger

Run:

```bash
deno task ledger:start
```

This command starts the named reusable ledger container, waits for Horizon,
Soroban RPC, Friendbot, Stellar Lab, and ledger meta to become ready, then
prints the URLs for each service.

While startup is in progress, the terminal stays occupied because the script is
waiting for Quickstart to finish booting the enabled services. On the first run,
this can take longer because Docker may need to pull the `stellar/quickstart`
image first.

When the URLs are printed, the command exits and returns you to the shell. The
container keeps running in the background so you can use it in the next steps.

If you also want to mirror the container stdout and stderr in the terminal, run
`deno task ledger:start:log` instead. That variant streams the startup logs
while the reusable ledger initializes, prints the service URLs, explains that
the container remains running, and then exits on its own.

### Step 2: Send Sample Transactions

Run:

```bash
deno task ledger:transactions
```

Run this after step 1 has finished. If you want to keep the URLs from step 1
visible while you send transactions, using a second terminal is convenient, but
it is not required.

This command attaches to the running reusable ledger, retrieves its service
details, builds a Colibri `NetworkConfig`, initializes accounts with Friendbot,
and submits a few sample transactions through the classic transaction pipeline.
It prints the transaction hashes so you can compare them with what you see in
Stellar Lab or the transactions explorer.

If you also want to stream the container output while this runs, use
`deno task ledger:transactions:log`. That variant shows recent container logs
during the transaction flow, then exits after printing that the reusable ledger
is still running.

### Step 3: Restart The Reusable Ledger

Run:

```bash
deno task ledger:restart
```

This command attaches to the named reusable ledger container, restarts it, waits
until the enabled services are ready again, and then prints the current URLs.

If you want the container output in the terminal during the restart, use
`deno task ledger:restart:log`. That variant streams logs from both phases of
the restart: the current container shutting down and the restarted container
coming back up, then exits after printing that the reusable ledger is running
again.

### Step 4: Stop The Reusable Ledger

Run:

```bash
deno task ledger:stop
```

This command attaches to the named reusable ledger container and stops it when
you are done exploring locally.

If you want to see the container output while it shuts down, use
`deno task ledger:stop:log`. That variant streams the shutdown logs and then
exits after confirming that the reusable ledger has been stopped.

When the reusable ledger starts, it prints URLs for:

- Horizon
- Soroban RPC
- Friendbot
- Stellar Lab
- Transactions Explorer
- Ledger Meta

That makes it easy to start a container once and inspect what you are doing in
the browser while still using Colibri programmatically.

## Image Tags

`containerImageVersion` accepts any Quickstart Docker tag string.

For common moving tags, use `QuickstartImageTags`:

```ts
const ledger = new StellarTestLedger({
  containerImageVersion: QuickstartImageTags.LATEST,
});
```

For pinned or custom Quickstart tags, pass the tag directly:

```ts
const ledger = new StellarTestLedger({
  containerImageVersion: "v632-b942.1-testing",
});
```

## Network Details to Colibri Config

Both the test suite and the reusable ledger scripts convert the returned network
details into a Colibri config before interacting with the ledger:

```ts
const networkDetails = await ledger.getNetworkDetails();
const networkConfig = NetworkConfig.CustomNet(networkDetails);
```

## Learn More

- [@colibri/test-tooling on JSR](https://jsr.io/@colibri/test-tooling)
- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
