/**
 * Generate a deterministic account image without consulting the network.
 * Run: deno task render
 */
import { Identicon } from "@colibri/identicon";
import { LocalSigner } from "@colibri/core";

// A valid public G-address is enough; the account need not exist on-chain.
// Never pass a secret key, contract address or muxed address to this example.
using account = LocalSigner.generateRandom();
const icon = new Identicon(account.publicKey());

/**
 * Both formats describe the same pattern. SVG is text, while PNG is binary:
 * choose the corresponding Deno file writer. The output directory is ignored
 * by Git because each run generates a new demonstration identity.
 */
const output = new URL("./.output/", import.meta.url);

await Deno.mkdir(output, { recursive: true });

await Deno.writeTextFile(new URL("account.svg", output), icon.toSvg());

await Deno.writeFile(new URL("account.png", output), icon.toPng({ size: 224 }));

console.log("Account:", account.publicKey());
console.log("Open:", new URL("account.svg", output).pathname);
console.log("PNG:", new URL("account.png", output).pathname);
console.log("The same address always produces the same pattern.");
console.log("An identicon is a recognition aid, not proof of identity.");
