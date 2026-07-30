/**
 * Explicit SEP-10 authentication through the unified WebAuth client.
 *
 * Run with: deno task sep10
 */
import { LocalSigner, NetworkConfig } from "@colibri/core";
import { WebAuthClient } from "@colibri/webauth";
import chalk from "chalk";

const anchorDomain = "testanchor.stellar.org";
const wallet = LocalSigner.generateRandom();

console.log(chalk.blue.bold("\n🔐 WebAuth: explicit SEP-10\n"));
console.log(chalk.gray("Account:"), wallet.publicKey());
console.log(chalk.gray("Home domain:"), anchorDomain);

const anchorFetch: typeof globalThis.fetch = async (input, init) => {
  const headers = new Headers(
    init && typeof init === "object" ? Reflect.get(init, "headers") : undefined,
  );
  headers.set("Accept", "*/*");
  return await fetch(input, { ...init, headers });
};

const client = await WebAuthClient.fromDomain(anchorDomain, {
  network: NetworkConfig.TestNet(),
  fetch: anchorFetch,
});

console.log(
  chalk.gray("Selected protocol:"),
  client.protocolFor(
    wallet.publicKey(),
  ),
);

const jwt = await client.sep10.authenticate({
  account: wallet.publicKey(),
  signer: wallet,
});

console.log(chalk.green("\n✓ SEP-10 authentication succeeded"));
console.log(chalk.gray("Protocol:"), jwt.protocol);
console.log(chalk.gray("Subject:"), jwt.subject);
console.log(chalk.gray("Issuer:"), jwt.issuer);
console.log(chalk.gray("Home domain:"), jwt.homeDomain);
console.log(chalk.gray("Expires at:"), jwt.expiresAt?.toISOString());
console.log(chalk.blue.bold("\nJWT:"));
console.log(jwt.token);
console.log(chalk.green.bold("\n✅ Done!\n"));
