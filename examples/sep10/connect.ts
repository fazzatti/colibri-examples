/**
 * Example: SEP-10 Authentication
 *
 * This example demonstrates how to authenticate with a Stellar anchor
 * using the SEP-10 Web Authentication protocol.
 *
 * SEP-10 allows wallets to prove ownership of a Stellar account
 * to an anchor service without exposing the secret key.
 *
 * The flow:
 * 1. Fetch the anchor's stellar.toml to discover the auth endpoint
 * 2. Request a challenge transaction from the anchor
 * 3. Sign the challenge to prove account ownership
 * 4. Submit the signed challenge to receive a JWT token
 *
 * Run with: deno task connect
 */
import { StellarToml, LocalSigner } from "@colibri/core";
import { Sep10Client } from "@colibri/sep10";
import { Networks } from "stellar-sdk";
import chalk from "chalk";

console.log(chalk.blue.bold("\n🔐 SEP-10 Authentication Example\n"));

// =============================================================================
// Configuration
// =============================================================================

/**
 * We'll authenticate against the Stellar Test Anchor,
 * a reference implementation provided by SDF for testing.
 */
const anchorDomain = "testanchor.stellar.org";
const networkPassphrase = Networks.TESTNET;

/**
 * Generate a random keypair to act as our wallet.
 * In a real application, this would be the user's existing keypair.
 *
 * Note: SEP-10 doesn't require the account to be funded on the network.
 * We're just proving we control the secret key.
 */
const wallet = LocalSigner.generateRandom();

console.log(chalk.gray("Wallet Public Key:"), wallet.publicKey());
console.log(chalk.gray("Anchor Domain:"), anchorDomain);

// =============================================================================
// Step 1: Fetch the stellar.toml
// =============================================================================

console.log(chalk.yellow("\n📄 Step 1: Fetching stellar.toml..."));

/**
 * The stellar.toml file is hosted at /.well-known/stellar.toml
 * It contains the anchor's configuration including the SEP-10 auth endpoint.
 *
 * Since the test anchor only accepts requests with a wildcard Accept header
 * or no Accept header at all (returning 406 for "text/plain" or "application/toml"),
 * we use a custom fetchFn to override the default Accept header.
 *
 * The library exposes fetchFn for scenarios like this, as well as for:
 * - Adding custom headers (e.g., API keys, authentication)
 * - Using a proxy or custom HTTP client
 * - Implementing retries or request logging
 */
const stellarToml = await StellarToml.fromDomain(anchorDomain, {
  fetchFn: async (input, init) => {
    const headers = new Headers(init?.headers as HeadersInit | undefined);
    headers.set("Accept", "*/*");
    return await fetch(input, { ...init, headers });
  },
});

console.log(chalk.green("✓ stellar.toml fetched successfully"));
console.log(chalk.gray("  Auth Endpoint:"), stellarToml.webAuthEndpoint);
console.log(chalk.gray("  Signing Key:"), stellarToml.signingKey);

// =============================================================================
// Step 2: Create SEP-10 Client
// =============================================================================

console.log(chalk.yellow("\n🔧 Step 2: Creating SEP-10 client..."));

/**
 * The Sep10Client handles all the SEP-10 protocol details:
 * - Requesting challenges
 * - Verifying server signatures
 * - Submitting signed challenges
 */
const client = Sep10Client.fromToml(stellarToml, networkPassphrase);

console.log(chalk.green("✓ SEP-10 client created"));

// =============================================================================
// Step 3: Authenticate
// =============================================================================

console.log(chalk.yellow("\n🔑 Step 3: Authenticating..."));

/**
 * The authenticate() method handles the full flow:
 * 1. Requests a challenge transaction from the anchor
 * 2. Verifies the challenge is properly signed by the anchor
 * 3. Signs the challenge with our wallet keypair
 * 4. Submits the signed challenge to get a JWT
 */
const jwt = await client.authenticate({
  account: wallet.publicKey(),
  signer: wallet,
});

console.log(chalk.green("✓ Authentication successful!\n"));

// =============================================================================
// Result: JWT Token
// =============================================================================

console.log(chalk.blue.bold("📋 JWT Token Details:"));
console.log(chalk.gray("  Subject:"), jwt.subject);
console.log(chalk.gray("  Issuer:"), jwt.issuer);
console.log(chalk.gray("  Home Domain:"), jwt.homeDomain);
console.log(chalk.gray("  Issued At:"), jwt.issuedAt?.toISOString());
console.log(chalk.gray("  Expires At:"), jwt.expiresAt?.toISOString());
console.log(chalk.gray("  Is Expired:"), jwt.isExpired);

console.log(chalk.blue.bold("\n🎫 Raw JWT Token:"));
console.log(chalk.white(jwt.token));

console.log(chalk.blue.bold("\n💡 Usage:"));
console.log(chalk.gray("  Use this token in the Authorization header:"));
console.log(
  chalk.white(`  Authorization: Bearer ${jwt.token.slice(0, 50)}...`)
);

console.log(chalk.green.bold("\n✅ Done!\n"));
