# Record real Testnet tests

Colibri's recorder adds execution evidence to ordinary Deno tests. These lessons
call the public **Stellar Testnet RPC and Friendbot**: there are no mocked
responses, substituted transports, local ledgers, or stored response fixtures.
They create disposable accounts, read balances, and submit real transactions.

The recorder answers a different question from an assertion. Deno tells you
whether a test passed; the evidence shows which pipelines ran, what was
simulated or submitted, and which fees were actually charged. You can collect
that evidence silently, print a summary, or retain JSON and a standalone HTML
report without changing the tests.

## Setup

Use **Deno 2.9.6 or newer**. From the repository root:

```sh
cd examples/test-recorder
deno install
```

This lesson declares Core **1.3.1** and test-tooling **1.1.0** in its own
[deno.json](deno.json). It does not upgrade the versions used by other lessons.
The recorder subpaths do not load the Docker-backed ledger tooling. No Docker,
wallet extension, Rust build, environment file, or saved secret is required.

The commands grant `-A` because the recorder launches Deno's test runner and
writes journals, while the tests contact Testnet. Every run funds three new
accounts through Friendbot, creates another account in a Classic transaction,
and submits three transactions. Use only the generated Testnet identities.
Friendbot/RPC outages or a Testnet reset can fail the tests; the examples do not
silently replace failed requests or skip assertions.

## Read the lesson files

| File                                           | What it teaches                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [recording.ts](recording.ts)                   | Choose trace, events, authorization, timing, resource, and fee capture independently from output.                                 |
| [tests/token.test.ts](tests/token.test.ts)     | `recordTests`, observed client construction, three real balance simulations, a 1 XLM SAC transfer, and a balance-delta assertion. |
| [tests/classic.test.ts](tests/classic.test.ts) | Attach to an existing pipeline, create and pay an account atomically, then record a separate manage-data transaction.             |
| [output/summary.ts](output/summary.ts)         | Print the aggregate summary and discard temporary artifacts.                                                                      |
| [output/json.ts](output/json.ts)               | Retain machine-readable evidence.                                                                                                 |
| [output/html.ts](output/html.ts)               | Add the standalone HTML report and console summary.                                                                               |

Each test file owns its account setup and cleanup. The tests can run
individually; none needs a transaction from another test to succeed. Setup hooks
record public account information, and `afterAll` destroys in-memory signers.
The disposable accounts remain on Testnet. No keys need to be copied or
committed.

## 1. Record silently

```sh
deno task test:silent
```

Expected: the native Deno results for **four test cases in two suites**, without
an extra Colibri summary or retained report directory. "Silent" describes the
recorder, not Deno's own progress and error output. The CLI still collects and
aggregates temporary journals, then removes them. This mode has the same
observation overhead and real network effects as the other modes.

## 2. Print a summary

```sh
deno task test:summary
```

Expected: the same tests followed by `Colibri evidence:` and an aggregate
summary. No JSON or HTML is retained. The summary counts observed tests and
executions; read pipeline executions are simulations, not additional ledger
transactions.

## 3. Keep JSON evidence

```sh
deno task test:json
```

Expected: the CLI prints a path ending in
`artifacts/colibri/<run-id>/report.json`. Each invocation creates a new run
folder; it does not overwrite another run. The folder is ignored by Git.

Open the JSON in an editor. Find the records named **Read recipient balance**,
**Transfer 1 XLM on Testnet**, and **Create and pay a Testnet account**. Their
caller results sit alongside execution records with the associated test,
network, pipeline stages, operation types, and chain outcome.

## 4. Generate and inspect HTML

```sh
deno task test:html
```

Open the printed `report.html` path in your browser. It is a self-contained
file: you do not need a web server or a connection to load the report. Expand
each suite/test and inspect its evidence and profiling. The run directory
contains:

```text
artifacts/colibri/<run-id>/
├── manifest.json
├── runner.junit.xml
├── fragments/         # Journals from the test-file workers
├── report.json        # Combined evidence plus native runner results
└── report.html        # Standalone viewer
```

Look for these differences:

- **Balance reads:** real RPC simulations with `not-submitted` chain status and
  resource budgets. They have no confirmed transaction fee.
- **SAC transfer:** simulation and authorization stages followed by submission
  and confirmation. The recipient gains exactly `10_000_000` stroops (1 XLM).
- **Classic transactions:** operation lists, confirmed ledger results, and
  actual fees. They have no Soroban simulation resource budget.
- **Profiling:** the three balance reads provide repeated samples. Elapsed time
  includes network latency and recorder overhead. Simulated resource budgets are
  not measured CPU use; confirmed fees are distinct and stored in stroops.
  Missing measurements remain absent instead of being invented.

The runner result and the observed callback/pipeline result are separate. A
successful transaction does not prove that later assertions passed. The CLI
preserves Deno's exit code and still aggregates evidence when tests fail.

## Rebuild HTML from an existing run

For example, turn a retained JSON run into HTML. Replace `<run-id>` with the
actual directory printed by `test:json`:

```sh
deno task report ./artifacts/colibri/<run-id> --html
```

Then open `report.html` in that directory. This command reads the retained
journals and runner results; **it does not fund accounts or rerun
transactions**. Keep the complete run folder if you want to aggregate it again.
A silent or summary-only run cannot be reconstructed after its temporary
journals are gone.

## Run one file or test

The CLI's `--` separates recorder options from native `deno test` arguments.
These are independent, useful variants when exploring one workflow:

```sh
# Only the Soroban lesson, retaining JSON and HTML.
deno run -A @colibri/test-tooling/recorder/cli run --config=output/html.ts -- -A tests/token.test.ts

# Only the Classic lesson, with a console summary.
deno run -A @colibri/test-tooling/recorder/cli run --config=output/summary.ts -- -A tests/classic.test.ts
```

For ordinary direct execution, `deno test -A tests/token.test.ts` also works.
Its imported recorder collects in memory, but it does not produce the CLI's
aggregate report or native runner reconciliation.

## Check the code without transactions

```sh
deno task check
deno lint .
deno fmt --check .
```

Every source file has comments explaining the SDK boundary and the relevant
Stellar behavior. `observer.create` and `observer.attach` preserve the original
client/pipeline; `observer.capture` preserves a call's return value or thrown
error. `observer.log` adds explicit context instead of intercepting the console.
Only public addresses, amounts, and confirmed hashes are logged. Signatures are
excluded from authorization evidence by [recording.ts](recording.ts).

## Colibri documentation

- [Test recorder guide](https://fifo-docs.gitbook.io/colibri/colibri-test-tooling/recorder)
- [Recorder API and package README](https://jsr.io/@colibri/test-tooling@1.1.0)
- [Stellar Asset Contract](https://fifo-docs.gitbook.io/colibri/colibri-core/asset/stellar-asset-contract)
- [Pipelines](https://fifo-docs.gitbook.io/colibri/colibri-core/pipelines)
