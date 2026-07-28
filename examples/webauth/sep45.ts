/**
 * Explicit SEP-45 authentication using a Testnet-deployed passkey account.
 *
 * Run with: deno task sep45
 */
import chalk from "chalk";
import { startTestnetWebAuthEnvironment } from "./testnet-environment.ts";

console.log(chalk.blue.bold("\n🔐 WebAuth: explicit SEP-45\n"));
console.log(chalk.gray("Funding a temporary deployer on Stellar Testnet..."));

const environment = await startTestnetWebAuthEnvironment();

try {
  console.log(
    chalk.gray("Passkey contract account:"),
    environment.contractAccount,
  );
  console.log(
    chalk.gray("Selected protocol:"),
    environment.client.protocolFor(environment.contractAccount),
  );
  console.log(chalk.gray("Authorizing the challenge with P-256..."));

  const jwt = await environment.client.sep45.authenticate({
    account: environment.contractAccount,
    authorize: environment.credential.authorize,
  });

  console.log(chalk.green("\n✓ SEP-45 authentication succeeded"));
  console.log(chalk.gray("Protocol:"), jwt.protocol);
  console.log(chalk.gray("Subject:"), jwt.subject);
  console.log(chalk.gray("Issuer:"), jwt.issuer);
  console.log(chalk.gray("Home domain:"), jwt.homeDomain);
  console.log(chalk.gray("Expires at:"), jwt.expiresAt?.toISOString());
  console.log(chalk.blue.bold("\nJWT:"));
  console.log(jwt.token);
} finally {
  console.log(chalk.gray("\nStopping the local WebAuth server..."));
  await environment.close();
}

console.log(chalk.green.bold("\n✅ Done!\n"));
