/**
 * Start the optional standalone auth fixture from examples/web: deno task auth.
 * Dev and preview start the same fixture automatically through the Vite plugin.
 * Keep this process alive while using another server to display the examples.
 *
 * @module
 */
import { startAuthServer } from "./server.ts";

startAuthServer();
