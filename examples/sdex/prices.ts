/**
 * Example: Exact Price Ratios
 *
 * Construct and compare prices as integer ratios. Decimal text preserves the
 * chosen limit without JavaScript floating-point rounding; no account
 * funding or market data is needed.
 *
 * Run: deno task prices
 */
import { LocalSigner, StellarPrice } from "@colibri/core";
import { Asset } from "stellar-sdk";

// An offline price lesson: no account funding, RPC or market quote is involved.
using issuer = LocalSigner.generateRandom();
const demo = new Asset("PRICE", issuer.publicKey());
const xlm = Asset.native();

// Decimal TEXT preserves a caller's exact limit: 1.25 becomes the ratio 5/4.
const decimal = StellarPrice.fromDecimal("1.25");

console.log("Exact ratio for 1.25:", decimal);

/**
 * A native SDK operation accepts the { n, d } ratio directly. Colibri's
 * human-language sell/buy conveniences use decimal text; use the
 * native-shaped createSellOffer/createBuyOffer path when your exact limit is
 * a fraction. Do NOT pass format(ratio)'s display text "2/3" as a decimal
 * input. "3 PRICE for 2 XLM" is 2/3 XLM per PRICE, without JavaScript's
 * rounding.
 */
const ratio = StellarPrice.fromAmounts({ baseAmount: "3", quoteAmount: "2" });

const description = StellarPrice.describe({
  price: ratio,
  baseAsset: demo,
  quoteAsset: xlm,
});

console.log(description);

// Reversing the quote direction changes XLM per PRICE to PRICE per XLM.
const inverse = StellarPrice.invert(ratio);
const formattedInverse = StellarPrice.format(inverse);

console.log("Exact inverse:", formattedInverse);

// Comparison returns -1, 0, or 1, without converting either ratio to a float.
const comparison = StellarPrice.compare(ratio, decimal);

console.log("2/3 compared with 1.25:", comparison);
