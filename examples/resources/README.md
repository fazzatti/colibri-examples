# Adjust Soroban transaction resources

Soroban simulation recommends the instructions, disk-read bytes, write bytes,
and resource fee a contract invocation needs. Colibri's
[`TransactionConfig.resources`](https://fifo-docs.gitbook.io/colibri/colibri-core/transaction-config/resources)
lets you replace selected recommendations with **overrides**, or add **padding**
before the transaction is signed.

These three independent lessons use a small public counter. They show manual
configuration first, then the separate calculator that prices resource growth
using network settings. Each script funds a disposable Testnet account, deploys
its own counter, increments it once, and reads the confirmed value.

## Setup

Follow the [workspace setup](../../README.md#run-a-lesson), then:

```sh
cd examples/resources
```

This directory pins released **`@colibri/core` 1.4.0** and Stellar JS SDK
17.0.1. Use Deno 2.7.11 or newer. The calculator requires a network with
protocol 23 or newer; these commands use public Testnet. Friendbot provides test
XLM, so no keys, environment variables, Docker, or local ledger are needed.

The checked-in [counter Wasm](../contract/contract/counter.wasm) is shared with
the [generic contract lesson](../contract/README.md). Its
[source](../contract/contract/src/lib.rs) deliberately has no authorization on
`increment`. It is a teaching contract, not an access-control pattern. A Rust
build is optional; see the
[contract rebuild instructions](../contract/README.md).

## Add manual padding

```sh
deno task padding
```

[`padding.ts`](./padding.ts) calls `Contract.invoke` with:

```ts
resources: {
  padding: {
    instructions: { percent: 10 },
    writeBytes: { amount: 10 },
    resourceFee: { amount: "5000" },
  },
}
```

This adds 10% to the final instruction recommendation, ten bytes to the write
budget, and 5,000 stroops to the total resource fee. Percentages round upward to
whole resource units; `percent: 10` means an **additional 10%**, not a
multiplier of ten. Each field accepts either `amount` or `percent`. For example,
`instructions: { amount: 100_000 }` adds a fixed instruction count, while
`resourceFee: { percent: 10 }` adds 10% of the simulated total resource fee.

The CPU and byte changes **do not automatically increase the fee**. Likewise,
raising the fee does not raise the CPU or byte budgets. The manually chosen fee
allowance here demonstrates the syntax; it is not a price quote or a guaranteed
refundable margin. Use the [calculator lesson](#calculate-and-apply-padding)
when you want the additional CPU and byte budgets priced for you.

## Set absolute overrides

```sh
deno task override
```

[`override.ts`](./override.ts) sets the final instruction budget to 12,000,000
and the final resource fee to 100,000 stroops:

```ts
resources: {
  override: {
    instructions: 12_000_000,
    resourceFee: "100000",
  },
}
```

An override replaces a recommendation; it is not an amount to add. These values
are a manual demonstration policy, not recommended defaults. You must choose
sufficient fees and respect network limits when tuning budgets manually.

Overrides apply **after simulation**. If the final simulation recommends more
than an overridden value, Colibri rejects assembly with
[`RES_002`](https://fifo-docs.gitbook.io/colibri/reference/errors/core-resources)
before signing the envelope. An instruction override does not cap execution
inside the simulator.

Both branches also accept `diskReadBytes` and `writeBytes`, measured in whole
bytes. Omitted fields retain their simulated recommendations. You can override
one field and pad another, but cannot override and pad the same field.

## Calculate and apply padding

```sh
deno task calculator
```

[`calculator.ts`](./calculator.ts) makes the steps visible:

1. Build a native contract invocation and simulate it.
2. Read tariffs and limits with `getNetworkResourceSettings`.
3. Call the pure `calculateResourcePadding` utility with the simulation,
   settings, and desired additions.
4. Apply `calculation.padding` once through `assembleTransaction`, using that
   **same simulation**.
5. Sign the final envelope, submit it, and read the confirmed counter.

The request uses `refundableFee` to reserve an extra 5,000 stroops after pricing
the added instructions and write bytes. The result is a concrete padding object
with `resourceFee` already containing both additions. Do not add the refundable
allowance a second time. A refundable percentage, if used instead, is based on
the simulation's **total** resource fee because RPC does not isolate a
refundable recommendation.

The calculator preserves the existing allowance and calculates incremental
charges using the network's rounding rules. It checks the supplied limits but
does not predict future rent, new footprint keys, authorization changes, or
extra work caused by ledger-state changes. Network settings and simulation may
observe different ledgers. Recalculate when the transaction, simulation or
tariffs change.

Keep the calculation tied to its simulation. Calling `Contract.invoke` again
runs a new simulation, so blindly reusing an earlier quote may apply the
additions to a different baseline. The lower-level processes in this lesson make
the matching simulation explicit. For contracts that need additional Soroban
authorization, obtain the final enforcing simulation and signed auth entries
first; see the [delegated-signers lesson](../delegated-signers/README.md).

## Resource fees and inclusion fees

Resource fees are decimal **stroop strings**; 10,000,000 stroops equal one XLM.
Resource configuration works alongside the existing
[`fee` policy](https://fifo-docs.gitbook.io/colibri/colibri-core/transaction-config):

| Lesson         | Inclusion policy   | Total envelope fee bid                                                      |
| -------------- | ------------------ | --------------------------------------------------------------------------- |
| Manual padding | `base: "100"`      | Adjusted resource fee + 100 stroops for this one operation                  |
| Overrides      | `inclusion: "100"` | 100,000 + 100 = 100,100 stroops                                             |
| Calculator     | `max: "1000000"`   | Fixed at 1,000,000 stroops; the remainder after resources becomes inclusion |

The maximum is a total bid, not a request to estimate the cheapest fee. Assembly
rejects a cap that cannot also cover minimum inclusion. See the
[fee-policy lessons](../fees/README.md) for independent examples and the
[fee-bump lesson](../fee-bump/README.md) for an intentional outer fee bid.

## Expected results and limits

All three commands print the deployed contract address, a confirmed increment
transaction hash, a total fee bid, the actual charged fee, and **counter value
`1`**. The calculator also prints the simulation budgets, concrete padding,
additional-fee breakdown, observation ledgers, and settings protocol. The actual
charge can differ from the bid; resource recommendations and tariffs can change.

The scripts use a fresh instance and stop on failure. They do not retry with
larger budgets or silently change fee policy. For Colibri failures, the
[error-handling lesson](../../getting-started/handling-errors/README.md)
explains how to inspect metadata; the
[resource diagnostics guide](https://fifo-docs.gitbook.io/colibri/colibri-core/transaction-config/resources#diagnose-failures)
describes available budgets, counters and fee evidence. Public Testnet and
Friendbot availability can affect a run.

These controls apply to Soroban transactions; Classic transaction pipelines
reject `resources`. Deployment uses ordinary simulation recommendations in these
scripts, and only the increment demonstrates resource adjustments.

To check the three entrypoints without submitting transactions:

```sh
deno task check
```

## Learn more

- [Resource overrides, padding and calculator reference](https://fifo-docs.gitbook.io/colibri/colibri-core/transaction-config/resources)
- [Reading and invoking contracts](https://fifo-docs.gitbook.io/colibri/colibri-core/contract/invocation)
- [Transaction assembly](https://fifo-docs.gitbook.io/colibri/colibri-core/processes/assemble-transaction)
- [Core 1.4.0 API reference](https://jsr.io/@colibri/core@1.4.0/doc)
