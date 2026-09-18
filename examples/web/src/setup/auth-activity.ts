/**
 * Observe the example's real discovery/auth HTTP calls without reading payloads.
 *
 * Lessons pass this forwarding fetch into Colibri and keep SDK calls visible.
 * Only fixed operation labels, HTTP status and local session events are logged:
 * no request bodies, query parameters, challenge XDR, signatures or JWTs. A
 * unique query scope keeps a cached client from logging into another lesson.
 * The last 20 events live only in the mounted page and disappear on navigation.
 *
 * @module
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { authDomain } from "./fixtures.ts";

export interface AuthActivityEntry {
  id: number;
  time: number;
  message: string;
  kind: "info" | "success" | "error";
}

export function useAuthActivity() {
  const scope = `loopback-observed-${useId()}`;
  const [entries, setEntries] = useState<AuthActivityEntry[]>([]);
  const [pending, setPending] = useState(0);
  const sequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const record = useCallback((
    message: string,
    kind: AuthActivityEntry["kind"] = "info",
  ) => {
    if (!mounted.current) return;
    const entry = { id: ++sequence.current, time: Date.now(), message, kind };
    setEntries((previous) => [...previous.slice(-19), entry]);
  }, []);

  // Observe request boundaries, not invented protocol phases. In Colibri's
  // SEP-10 flow, POST /auth occurs only after challenge validation and signing.
  // We never clone or consume the response; Colibri parses and validates it.
  const fetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      const method = init?.method ??
        (input instanceof Request ? input.method : "GET");
      const operation = url.pathname === "/.well-known/stellar.toml"
        ? "GET stellar.toml — discover the service"
        : url.pathname === "/auth" && method === "GET"
        ? "GET /auth — request a SEP-10 challenge"
        : url.pathname === "/auth" && method === "POST"
        ? "POST /auth — exchange the signed challenge (client validation and signing completed)"
        : "Service request";
      record(operation);
      if (mounted.current) setPending((count) => count + 1);
      try {
        // Preserve the native browser fetch receiver and Colibri's abort/timeout
        // signal. Network errors include the actual local setup/recovery action.
        const response = await globalThis.fetch(input, init);
        record(
          `${operation}: HTTP ${response.status} received.`,
          response.ok ? "success" : "error",
        );
        return response;
      } catch (cause) {
        record(`${operation}: request failed or timed out.`, "error");
        throw new Error(
          `Cannot reach the local auth service at http://${authDomain}. Restart deno task dev or deno task preview from examples/web; they start the fixture automatically. Alternatively run deno task auth in another terminal. Open the demo on 127.0.0.1 or localhost using port 5173 or 4173.`,
          { cause },
        );
      } finally {
        if (mounted.current) setPending((count) => count - 1);
      }
    },
    [record],
  );

  const clear = useCallback(() => setEntries([]), []);
  return { entries, busy: pending > 0, record, clear, fetch, scope };
}
