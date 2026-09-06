/**
 * Explicit SEP-10 authentication through the unified WebAuth client.
 *
 * Run with: deno task sep10
 */
import { LocalSigner, NetworkConfig } from "@colibri/core";
import { WebAuthClient } from "@colibri/webauth";
import chalk from "chalk";

const anchorDomain = "testanchor.stellar.org";
using wallet = LocalSigner.generateRandom();

console.log(chalk.blue.bold("\n🔐 WebAuth: explicit SEP-10\n"));
console.log(chalk.gray("Account:"), wallet.publicKey());
console.log(chalk.gray("Home domain:"), anchorDomain);

const anchorFetch: typeof globalThis.fetch = async (input, init) => {
  // This public demonstration anchor rejects the narrower TOML Accept header.
  // Keep this interoperability override local to this anchor, not a global fetch.
  const headers = new Headers(init?.headers);

  headers.set("Accept", "*/*");

  return await fetch(input, { ...init, headers });
};

const client = await WebAuthClient.fromDomain(anchorDomain, {
  network: NetworkConfig.TestNet(),
  fetch: anchorFetch,
});

// G-addresses select SEP-10. The explicit path below prevents protocol fallback.
const protocol = client.protocolFor(wallet.publicKey());

console.log(chalk.gray("Selected protocol:"), protocol);

const jwt = await client.sep10.authenticate({
  account: wallet.publicKey(),
  signer: wallet,
});

// jwt.token is the bearer JWT. Print claims only, never the bearer credential.
console.log(chalk.green("\n✓ SEP-10 authentication succeeded"));
console.log(chalk.gray("Protocol:"), jwt.protocol);
console.log(chalk.gray("Subject:"), jwt.subject);
console.log(chalk.gray("Issuer:"), jwt.issuer);
console.log(chalk.gray("Home domain:"), jwt.homeDomain);
console.log(chalk.gray("Expires at:"), jwt.expiresAt?.toISOString());

console.log(chalk.green.bold("\n✅ Done!\n"));
