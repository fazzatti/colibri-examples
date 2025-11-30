# Contract Transfer Example

This example demonstrates how to perform a simple transfer of XLM between accounts on TestNet using the Stellar Asset Contract (SAC) helper from [@colibri/core](https://jsr.io/@colibri/core).

## Overview

The example showcases:

- Setting up a network configuration for TestNet
- Generating random keypairs using `LocalSigner`
- Funding accounts with Friendbot
- Using the `StellarAssetContract` client to transfer XLM
- Reading account balances from the SAC contract

## Usage

Before proceeding, make sure to follow the setup described in the [workspace README](../../README.md).

### Run the Transfer

Execute the transfer script:

```bash
deno task transfer
```

This script:

1. Generates two random keypairs (sender and receiver)
2. Funds both accounts using TestNet Friendbot
3. Checks the receiver's initial balance
4. Transfers 50 XLM from sender to receiver via the SAC contract
5. Confirms the transfer by checking the receiver's updated balance

## Key Concepts

### NetworkConfig

Predefined network configurations provide standardized setups for different networks:

```ts
const networkConfig = NetworkConfig.TestNet();
```

### LocalSigner

Utility for generating keypairs and signing transactions locally:

```ts
const sender = LocalSigner.generateRandom();
const receiver = LocalSigner.generateRandom();
```

### StellarAssetContract

High-level client for interacting with Stellar Assets through their SAC smart contracts:

```ts
const XLM = StellarAssetContract.NativeXLM(networkConfig);

// Read balance
const balance = await XLM.balance({ id: receiver.publicKey() });

// Transfer funds
await XLM.transfer({
  from: sender.publicKey(),
  to: receiver.publicKey(),
  amount: 50_0000000n, // 50 XLM in stroops
  config: {
    source: sender.publicKey(),
    fee: "100000",
    signers: [sender],
    timeout: 30,
  },
});
```

## Learn More

- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
