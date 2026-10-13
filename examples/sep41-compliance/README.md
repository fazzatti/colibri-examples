# Inspect a deployed contract for SEP-41 compatibility

[SEP-41](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md)
defines the Soroban token interface: balances, allowances, transfers, burning,
and token metadata. This example takes a network and contract ID, fetches the
contract's deployed Wasm, and uses Colibri to report its declared standards and
structural compatibility with SEP-41.

The [source](./inspect.ts) makes the network load and Colibri checks explicit.
It reads public ledger data without a wallet, private key, funded account,
simulation, or transaction submission.

## Setup and run

Follow the [workspace setup](../../README.md) with Deno 2.7.11 or newer, then:

```sh
cd examples/sep41-compliance
deno task inspect mainnet CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN
```

This inspects **SolvBTC on Mainnet**. Supply another contract ID to inspect a
different contract. For Testnet, use an ID deployed on Testnet:

```sh
deno task inspect testnet <TESTNET_CONTRACT_ID>
deno task inspect --help
```

The first argument must be `mainnet` or `testnet`; the second must be a valid
C-prefixed contract ID. Mainnet and Testnet are separate ledgers, so an ID on
one may not exist on the other. The example uses `NetworkConfig.MainNet()` or
`NetworkConfig.TestNet()` and prints the selected RPC URL.

The task grants only network access and uses the existing frozen workspace
lockfile. It inherits the workspace's released Colibri Core 0.30.0 resolution;
no additional dependency or contract build is required.

## Follow the inspection

1. `Contract.loadSpecFromNetwork()` resolves the deployed contract instance,
   downloads its Wasm, and loads the embedded specification. The output records
   the code hash, byte count, and ledger reported by the code lookup.
2. `getSepClaims()` and `claimsSep(41)` inspect the author's SEP-47
   declarations. The report includes malformed declarations. These are claims,
   independently of whether the interface matches.
3. `matchesInterface()` compares the specification with each version in
   `ContractStandards.SEP41.versions`. This exposes compatibility with older
   interfaces, including the `Address` versus `MuxedAddress` transfer
   distinction.
4. `analyzeInterface(ContractStandards.SEP41.latest)` prints the detailed result
   for the newest bundled definition: missing functions, incompatible signatures
   with expected/actual differences, additional functions, and type diagnostics.
   Additional methods do not prevent a match.

`latest` means **the newest definition bundled in the installed Colibri
release**, currently SEP-41 **0.5.1** with this lockfile. It does not fetch or
certify compatibility with a newer revision of the SEP document.

## Interpret the result

Read the version table alongside the detailed diagnostics. `strictMatch: true`
in the table (or `matches: true` in the detailed Colibri report) establishes
that the embedded interface matches that bundled definition. `false` identifies
missing or different interface elements for that definition. Colibri's
comparison includes **parameter names**, not just argument and return types.
Read the expected/actual differences: a name difference alone is not evidence of
incorrect execution. An absent SEP-47 claim is separate from either result.

### Observed SolvBTC result

On **2026-10-13**, the Mainnet command above inspected code hash
`f11078394fd06b3992b4274611a7c47809707bdce61254cffa6dd40fcaad364f` (15,700
bytes), observed at ledger **64921831**:

- No SEP-47 declaration of SEP-41 was found; no malformed claims were found.
- All ten required function names were present.
- The strict comparison did not match any bundled version. For bundled SEP-41
  0.5.1, the report identified these differences:

| Function    | Specification field  | Colibri expects | SolvBTC declares |
| ----------- | -------------------- | --------------- | ---------------- |
| `allowance` | First parameter name | `from`          | `owner`          |
| `approve`   | First parameter name | `from`          | `owner`          |
| `balance`   | First parameter name | `id`            | `account`        |
| `transfer`  | Destination type     | `muxed_address` | `address`        |

The older bundled 0.2.0/0.3.0 definitions use `Address` for the destination, but
the three parameter-name differences still prevent a strict match. Extra
management functions and types appear in the report and are permitted. Future
runs may observe upgraded code; use the hash to distinguish the result.

These checks do not execute the implementation. They cannot establish correct
authorization, balance accounting, allowance expiry, event emission, transfer
restrictions, or full behavioral compliance. A contract may expose matching
signatures while behaving differently. An interface match also does not verify
source reproducibility; see
[build verification](../build-verification/README.md).

Results describe the code observed during this run. Contract instances can be
upgraded, and instance/code lookups are separate network observations. Keep the
printed Wasm hash when comparing results from different runs.

## Unavailable contracts and inspection errors

The contract and its code must be available through the selected RPC endpoint. A
wrong network, missing or archived entry, RPC outage, or unsupported Wasm/spec
encoding can prevent inspection. Native Stellar Asset Contracts use built-in
code rather than downloadable Wasm, so this workflow cannot inspect them. An
error is an incomplete inspection, not a negative compliance result.

Exit status is `0` when a report completes, including an interface mismatch; `1`
when inspection fails; and `2` for invalid arguments. `--help` exits `0`.

## Learn more

- [Offline metadata and interface inspection](../contract-metadata/README.md)
- [Use a SEP-41 token](../sep41-token/README.md)
- [Colibri documentation](https://fifo-docs.gitbook.io/colibri/)
