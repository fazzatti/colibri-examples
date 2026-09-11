import {
  CounterStatus,
  CounterSummary,
  type CounterSummaryArgs,
} from "./generated/types.ts";
import { SorobanType } from "./generated/colibri.ts";

// A type annotation describes the plain decoded value. The generated enum
// exposes the numeric discriminants declared by the contract, not new indices.
const plain: CounterSummary = {
  count: 7,
  status: CounterStatus.Counting,
};

// CounterSummaryArgs describes inputs to the TYPE factory, not a contract call.
// Nested fields can mix ordinary values and validated Soroban wrappers.
const args: CounterSummaryArgs = {
  count: SorobanType.U32.from(7),
  status: CounterStatus.from(CounterStatus.Counting),
};

// In value position, CounterSummary is the factory with the same name as the
// type. It validates the complete struct against the embedded contract spec.
const validated = CounterSummary.from(args);
const encoded = validated.toScVal();
const decoded: CounterSummary = CounterSummary.fromScVal(encoded).value;

console.log("Plain value:", plain);
console.log("Validated value:", validated.value);
console.log("XDR (base64):", encoded.toXdr("base64"));
console.log("Decoded count:", decoded.count, "status:", decoded.status);

// Encoding validity is separate from application rules. Zero is a valid U32,
// but increment(0) is rejected by this counter; see the errors lesson.
console.log("Valid U32, invalid increment:", SorobanType.U32.from(0).value);
