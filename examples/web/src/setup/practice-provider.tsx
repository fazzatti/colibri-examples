import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createColibriConfig } from "@colibri/react";
import { ColibriQueryProvider } from "@colibri/react/provider";
import { createPracticeIdentity } from "./practice-identity.ts";
import { network } from "./network.ts";

const IdentityContext = createContext<
  ReturnType<typeof createPracticeIdentity> | null
>(null);

// Hooks resolve their nearest provider. Nesting one inside the lesson keeps its
// identity and query cache separate from the header and the real wallet.
export function PracticeProvider({ children }: PropsWithChildren) {
  const [identity] = useState(createPracticeIdentity);
  const [config] = useState(() =>
    createColibriConfig({
      network,
      connectors: [identity.connector],
    })
  );
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Strict Mode immediately replays effects. Release authority only on an
      // actual unmount; neither config.destroy() nor cache cleanup erases keys.
      queueMicrotask(() => {
        if (mounted.current) return;
        config.destroy();
        identity.destroy();
      });
    };
  }, [config, identity]);

  return (
    <IdentityContext.Provider value={identity}>
      <ColibriQueryProvider config={config}>{children}</ColibriQueryProvider>
    </IdentityContext.Provider>
  );
}

// SEP-10 currently needs the complete Core keypair signer, beyond the guarded
// transaction capabilities returned by useSigners. Keep it inside this lesson.
export function usePracticeIdentity() {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new Error("A practice identity needs its lesson provider.");
  }
  return identity;
}
