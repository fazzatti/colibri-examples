# Contract claims versus interface analysis

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

Two offline scripts read the checked-in SEP-41 token Wasm. They deliberately
keep author claims separate from Colibri's structural interface analysis.

## Run

From the repository root:

```sh
cd examples/contract-metadata
deno task claims
deno task interface
```

- `claims`: Extract SEP-46 metadata and interpret the SEP-47 declarations.
- `interface`: Compare the embedded native SDK Spec against the bundled SEP-41
  definition.

Run one command at a time. Each runnable path is independent; it does not reuse
an account or transaction from another lesson.

## Follow the code

1. Read Wasm bytes without RPC or deployment.
2. For claims, inspect the author's metadata and ask whether it declares SEP-41.
3. For interface analysis, inspect missing, incompatible, and extra functions
   independently.

## Important details

The fixture claims SEP-41 and structurally matches it. Its constructor and
mint_with_reference extension remain visible as additional methods. Neither
result proves authorization behavior, security, economic correctness, or source
reproducibility. `latest` is the version bundled in the installed Colibri
package, not an online lookup. These files reuse an artifact, not a workflow
helper.
