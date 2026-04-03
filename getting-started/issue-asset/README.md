# Issue an Asset Getting Started Example

This example introduces the `StellarAssetContract` helper in
[@colibri/core](https://jsr.io/@colibri/core).

The helper gives you a high-level interface for working with Stellar assets
through their Stellar Asset Contract (SAC) deployment. In practice, that means
you can use it in three different ways:

- `StellarAssetContract.NativeXLM(...)` creates a client for the native XLM
  SAC
- `StellarAssetContract.fromAsset(...)` creates a client for an existing SAC
  that has already been deployed for a specific asset
- `StellarAssetContract.deploy(...)` deploys a new SAC for an asset and returns
  the client for that deployed contract

Once you have a client, you can read balances, transfer funds, mint supply, and
perform the other asset-specific actions exposed by the contract.

This example focuses on issuing a custom asset on TestNet.

## Usage

Before proceeding, make sure to follow the setup described in the
[workspace README](../../README.md).

Run the example with:

```bash
deno task issue-asset
```

The example uses TestNet and Friendbot, so it requires internet access.

## Custom Asset

In this example, the script uses `StellarAssetContract.deploy(...)` to create a new `COLIBRI` SAC on TestNet and
get the client back immediately.

The script shows the extra steps needed for a non-native asset:

1. Creates an issuer account and a holder account
2. Deploys the `COLIBRI` SAC contract on TestNet
3. Uses a classic Stellar transaction to add a trustline for the holder
4. Mints `COLIBRI` directly to the trusted holder account
5. Reads the holder balance before and after the mint

The trustline step is classic Stellar behavior, not a SAC helper method. That is
why the script uses Colibri's classic transaction pipeline for that one step and
then returns to the SAC helper for the mint itself.

## Learn More

- [@colibri/core on JSR](https://jsr.io/@colibri/core)
- [Colibri GitHub Repository](https://github.com/fazzatti/colibri)
