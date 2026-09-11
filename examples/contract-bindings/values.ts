/**
 * Contract Bindings Example: Custom Values
 *
 * After `deno task generate`, explore the struct and enum exported by the
 * counter package. This example runs offline: constructing and encoding values
 * uses the embedded specification, with no account or deployment required.
 */
import {
  CounterStatus,
  CounterSummary,
  type CounterSummaryArgs,
} from "@example/counter";
import { SorobanType } from "@example/counter/colibri";

/**
 * The Rust CounterSummary struct becomes a TypeScript type describing ordinary
 * decoded data. Its count is a number and its status uses the discriminants
 * declared by CounterStatus in Rust: Empty is 0 and Counting is 1.
 */
const plain: CounterSummary = {
  count: 7,
  status: CounterStatus.Counting,
};

console.log("Plain value:", plain);

/**
 * CounterSummaryArgs describes inputs to the type factory, not the arguments
 * of a contract method. It accepts plain values, validated Soroban values, or
 * a mixture of both. Here we explicitly validate the count and status first.
 */
const args: CounterSummaryArgs = {
  count: SorobanType.U32.from(7),
  status: CounterStatus.from(CounterStatus.Counting),
};

/**
 * In value position, CounterSummary is a factory with the same name as the
 * type. from() validates the complete struct; .value exposes its plain data.
 * We could pass the earlier plain object to from() instead of these wrappers.
 */
const validated = CounterSummary.from(args);

console.log("Validated value:", validated.value);

/**
 * A validated value can encode itself to an ScVal, Stellar's contract-value
 * representation in XDR. Decode it with the same factory to recover the typed
 * fields. Generated clients perform this conversion when making calls too.
 */
const encoded = validated.toScVal();
const decoded: CounterSummary = CounterSummary.fromScVal(encoded).value;

console.log("XDR (base64):", encoded.toXdr("base64"));
console.log("Decoded count:", decoded.count, "status:", decoded.status);

/**
 * Type validation checks encoding rules, not the contract's business rules.
 * Zero fits in a U32, but this counter rejects increment(0). The errors example
 * shows how the generated package reports that contract-level rejection.
 */
console.log("Valid U32, invalid increment:", SorobanType.U32.from(0).value);
