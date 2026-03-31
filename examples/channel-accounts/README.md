# Channel Accounts Example

This example demonstrates how to combine
[@colibri/plugin-channel-accounts](https://jsr.io/@colibri/plugin-channel-accounts)
with [@colibri/plugin-fee-bump](https://jsr.io/@colibri/plugin-fee-bump) while
submitting XLM transfers through the Stellar Asset Contract (SAC) on public
TestNet.

## Overview

The goal of this example is to show a practical parallel-submission flow using
Colibri's plugin model.

Instead of building classic `payment` operations directly, the script uses
`StellarAssetContract.NativeXLM(...)` and calls `XLM.transfer(...)` thirty
times.

The example also keeps the sender and receiver concept intentionally simple:

- the sender is a normal `G...` account
- each receiver is the same account encoded as a different muxed `M...` address
- the muxed id is just the receiver number (`1` through `30`)

This makes it easy to focus on the actual Colibri concepts being demonstrated:

- generating muxed addresses from a base account
- opening sponsored channel accounts
- attaching runtime plugins to the SAC invoke pipeline
- submitting several transfers in parallel without sequence conflicts
- wrapping each transfer in a fee bump paid by a sponsor account

## Usage

Before proceeding, make sure to follow the setup described in the
[workspace README](../../README.md).

Run it with:

```bash
deno task parallel-mints
```

This script talks directly to public TestNet, so it requires internet access and
may take a few seconds to complete.

## What The Script Does

When you run the script, it performs the following steps:

1. Generates two random keypairs:
   - a sponsor account
   - a sender account
2. Funds both accounts with Friendbot
3. Creates a `NativeAccount` wrapper for each one
4. Creates the native XLM SAC client with
   `StellarAssetContract.NativeXLM(networkConfig)`
5. Opens 5 sponsored channel accounts
6. Attaches the channel-accounts plugin to the SAC invoke pipeline
7. Attaches the fee-bump plugin to the same SAC invoke pipeline
8. Builds 30 muxed receivers from the sender base address
9. Triggers 30 `XLM.transfer(...)` calls without waiting for each one
10. Logs each transaction hash as it completes
11. Closes the channel accounts after all submitted transfers settle

## Why Muxed Addresses?

A muxed address is still the same Stellar account underneath, but with an extra
64-bit id attached to it.

In practice, muxed addresses are useful when one base account wants to expose
several logical receivers. For example, an exchange can reuse one custody
account but give each customer a different muxed id.

In this example we use muxed addresses because they are a clean way to show:

- one sender account (`G...`)
- several distinct receiver addresses (`M...`)
- no extra trustline or custom asset setup

The sender creates them directly from its own base account:

```ts
const receiver = sender.muxedAddress("1");
```

## Why Channel Accounts?

On Stellar, a single source account can only advance one sequence number at a
time. If you try to fire many transactions from the same source account in
parallel, they will fight over that sequence.

Channel accounts solve that by letting you use a pool of alternate source
accounts for the inner transactions.

In this example:

- the sender still authorizes each XLM transfer
- the channel accounts provide alternate inner transaction sources
- the plugin rotates through the available channels automatically

That is what allows the script to submit thirty transfers concurrently while
only opening five channels.

The relevant wiring is:

```ts
XLM.contract.invokePipe.use(createChannelAccountsPlugin({ channels }));
```

## Why Fee Bumps?

Fee bumps let one account pay the fee for another transaction.

Here the sponsor account pays the outer fee-bump envelope, while the sender
still signs and authorizes the actual XLM transfer.

This separation is useful when:

- a service wants to sponsor user transactions
- the sender should authorize the action but not pay the fee
- you want a clean demo of Colibri's fee-bump plugin model

The example attaches the fee-bump plugin to the same SAC invoke pipeline:

```ts
XLM.contract.invokePipe.use(
  createFeeBumpPlugin({
    networkConfig,
    feeBumpConfig: {
      source: sponsor.address(),
      fee: "10000000",
      signers: [sponsor.signer()],
    },
  }),
);
```

The outer fee is higher than the normal base fee because the fee-bump envelope
must pay for the wrapped transaction as well.

## Why Use The SAC Client?

This example intentionally uses the XLM Stellar Asset Contract helper instead of
manually assembling classic operations.

That matters because it shows that channel accounts and fee bumps are not tied
to one specific transaction-building style. They can be attached at the pipeline
level and reused by higher-level Colibri tools too.

The key transfer call is:

```ts
await XLM.transfer({
  from: sender.address(),
  to: receiver,
  amount: 1_0000000n,
  config: {
    source: sender.address(),
    fee: baseFee,
    signers: [sender.signer()],
    timeout,
  },
});
```

## What To Look For In The Output

There are three important things to notice when the script runs:

1. The sender base address is printed as a normal `G...` account
2. The receivers are printed as `M...` muxed addresses
3. The transaction hashes do not necessarily appear in receiver order

That last point is expected and important.

Because each transfer is submitted immediately and logs from its own
`.then(...)`, the hashes appear as the network confirms them, not in the order
they were created. This is exactly the behavior you want to observe in a
parallel submission example.

## Learn More

- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [@colibri/plugin-channel-accounts on JSR](https://jsr.io/@colibri/plugin-channel-accounts)
- [@colibri/plugin-fee-bump on JSR](https://jsr.io/@colibri/plugin-fee-bump)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
