import { useEffect, useState } from "react";
import type { Lesson } from "../app/catalog.ts";
import provider from "../app/provider.tsx?raw";
import kit from "../setup/wallets-kit.ts?raw";
import freighter from "../setup/freighter.ts?raw";
import practice from "../setup/practice-identity.ts?raw";

const sources = import.meta.glob<string>("../examples/**/*.tsx", {
  query: "?raw",
  import: "default",
});
const setup = {
  "Provider": provider,
  "Wallets Kit": kit,
  "Freighter": freighter,
  "Practice identity": practice,
};

export function SourcePanel({ lesson }: { lesson: Lesson }) {
  const [source, setSource] = useState("");
  const [tab, setTab] = useState("Example");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let disposed = false;
    setSource("");
    setTab("Example");
    setCopied(false);
    void sources[`../examples/${lesson.file}.tsx`]?.().then((text) => {
      if (!disposed) setSource(text);
    }).catch(() => {
      if (!disposed) {
        setSource("Unable to load source. Reload the page to retry.");
      }
    });
    return () => {
      disposed = true;
    };
  }, [lesson.file]);
  const text = tab === "Example" ? source : setup[tab as keyof typeof setup];
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="source-panel" aria-label="Source code">
      <header>
        <div>
          <span className="eyebrow">Read the implementation</span>
          <h2>Small pieces. Real code.</h2>
        </div>
        <button
          type="button"
          className="secondary small"
          onClick={() => void copy()}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </header>
      <div className="source-tabs" role="group" aria-label="Source files">
        {["Example", ...Object.keys(setup)].map((name) => (
          <button
            type="button"
            className={tab === name ? "selected" : ""}
            aria-pressed={tab === name}
            key={name}
            onClick={() => {
              setTab(name);
              setCopied(false);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="source-path">
        {tab === "Example" ? `src/examples/${lesson.file}.tsx` : `${tab} setup`}
      </div>
      <pre
        tabIndex={0}
        aria-label="Source"
      ><code>{text || "Loading source…"}</code></pre>
      <footer>
        Loaded from the file running in this app.{" "}
        <a
          href={`https://github.com/fazzatti/colibri-examples/blob/main/examples/web/src/examples/${lesson.file}.tsx`}
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub ↗
        </a>
      </footer>
    </section>
  );
}
