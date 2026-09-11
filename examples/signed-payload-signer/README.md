# Signed payload: disclose the signature for another transaction

[Colibri documentation](https://fifo-docs.gitbook.io/colibri/) ·
[Example index](../../README.md)

A Stellar P key combines an Ed25519 public key with fixed payload bytes. Its
signature signs those bytes directly, not the hash of whichever transaction
carries it. In this lesson the payload is the hash of one already-finalized
transaction C.

## Usage

Follow the [workspace setup](../../README.md), then run:

```sh
cd examples/signed-payload-signer
deno task signed-payload
```

## Follow the disclosure

Open [`signed-payload.ts`](./signed-payload.ts) and follow the two transactions:

1. Fund Alice and Bob with Testnet XLM.
2. Finalize **C**, a 2-XLM payment from Bob to Alice. Its sequence, time bounds,
   fee, network, and operations are fixed now.
3. Construct
   `Ed25519SignedPayloadSigner.forTransaction({ signer: bob, transaction: C })`.
4. Submit **D**, a 1-XLM payment from Alice to Bob. Alice signs D normally; its
   extraSigners precondition additionally requires the P key containing Bob's
   public key and hash(C).
5. D's confirmed envelope exposes Bob's signature over hash(C).
6. Read that envelope, find and verify the disclosed signature using only Bob's
   public key, replace the P-specific signature hint with Bob's ordinary G hint,
   and submit the unchanged C. Do not ask Bob to sign a second time.

Expect the confirmed hash of D, then the confirmed hash of C. Between those
outputs, the script verifies the disclosed signature before using it.

C and D use different source accounts, so D does not consume C's sequence. The
signature bytes are reusable for C because C's transaction hash was the payload.
Replacing the four-byte hint changes lookup metadata, not the signature.

## Boundaries

This demonstrates **signature disclosure**, not an atomic or trustless exchange.
D may succeed while C later fails because of expiry, insufficient balance, or a
consumed sequence. Production protocols must enforce their own state and timing
constraints. An ordinary signature for D alone cannot satisfy the extra P-key
condition, and knowing the payload bytes alone is not enough: Bob's signature is
required.

No persistent P signer is installed on an account. A signature over a fixed
payload could be reused anywhere the same P key is accepted, which is why it
must not be mistaken for a transaction-specific policy by itself.

See
[CAP-40](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0040.md)
for the protocol's signature-disclosure semantics.
