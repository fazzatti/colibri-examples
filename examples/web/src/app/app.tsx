import {
  Component,
  type ComponentType,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useConnection } from "@colibri/react";
import { lessons } from "./catalog.ts";
import { SourcePanel } from "../components/source-panel.tsx";

const modules = import.meta.glob<{ default: ComponentType }>(
  "../examples/**/*.tsx",
);
const pages = new Map(
  lessons.map((lesson) => [
    lesson.id,
    lazy(() => modules[`../examples/${lesson.file}.tsx`]()),
  ]),
);
const groups = [...new Set(lessons.map((lesson) => lesson.group))];
function route() {
  return location.hash.slice(1).split("?")[0] || "network";
}

class LessonBoundary
  extends Component<{ children: ReactNode }, { error?: Error }> {
  override state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lesson failed", error, info.componentStack);
  }
  override render() {
    if (this.state.error) {
      return (
        <div className="failure" role="alert">
          <h2>Unable to open this lesson</h2>
          <p>{this.state.error.message}</p>
          <a href="#network">Return to the network lesson</a>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [id, setId] = useState(route);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const connection = useConnection();
  const lesson = lessons.find((entry) => entry.id === id);
  const Page = lesson && pages.get(lesson.id);
  useEffect(() => {
    const navigate = () => {
      setId(route());
      setMenuOpen(false);
      globalThis.scrollTo(0, 0);
    };
    addEventListener("hashchange", navigate);
    return () => removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    document.title = `${lesson?.title ?? "Not found"} · Colibri web examples`;
  }, [lesson]);
  return (
    <>
      <a
        className="skip"
        href="#lesson-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("lesson-content")?.focus();
        }}
      >
        Skip to lesson
      </a>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <a className="brand" href="#network">
          <span className="brand-mark" aria-hidden="true">c.</span>
          <span>
            colibri<small>WEB FIELD GUIDE</small>
          </span>
        </a>
        <div className="sidebar-intro">
          Learn it by running it.<br />Stellar, one hook at a time.
        </div>
        <label className="search">
          <span className="sr-only">Find a hook or lesson</span>
          <input
            placeholder="Find a hook or lesson…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <nav aria-label="Examples">
          {groups.map((group) => {
            const entries = lessons.filter((entry) =>
              entry.group === group &&
              `${entry.title} ${entry.hooks.join(" ")}`.toLowerCase().includes(
                search.toLowerCase(),
              )
            );
            return entries.length > 0 && (
              <div className="nav-group" key={group}>
                <h2>{group}</h2>
                {entries.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    aria-current={entry.id === id ? "page" : undefined}
                  >
                    <span>{entry.title}</span>
                    <small>{entry.hooks[0] ?? "Integration guide"}</small>
                  </a>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          React 19 · Colibri React 0.2<br />
          <a
            href="https://jsr.io/@colibri/react/doc"
            target="_blank"
            rel="noreferrer"
          >
            API reference ↗
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="menu-button secondary"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
          >
            Examples {menuOpen ? "−" : "+"}
          </button>
          <span className="breadcrumb">
            Examples <span>/</span> Web
          </span>
          <div className="topbar-right">
            <span className="network-pill">
              <i />Testnet
            </span>
            <a className="wallet-status" href="#wallet">
              {connection.status === "connected"
                ? `${connection.connection?.address.slice(0, 5)}…${
                  connection.connection?.address.slice(-4)
                }`
                : "Connect wallet ↗"}
            </a>
          </div>
        </header>
        <main id="lesson-content" tabIndex={-1}>
          {lesson && Page
            ? (
              <>
                <header className="lesson-heading">
                  <div className="eyebrow">
                    {lesson.group}{" "}
                    <span>
                      / {String(lessons.indexOf(lesson) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h1>{lesson.title}</h1>
                  <p>{lesson.subtitle}</p>
                  <div className="hook-tags">
                    {lesson.hooks.map((hook) => <code key={hook}>{hook}</code>)}
                  </div>
                </header>
                <div className="lesson-grid">
                  <section className="live-panel">
                    <div className="panel-heading">
                      <span className="eyebrow">Try it on Testnet</span>
                      <span className="live-dot">Live example</span>
                    </div>
                    <LessonBoundary key={lesson.id}>
                      <Suspense fallback={<p role="status">Loading lesson…</p>}>
                        <Page />
                      </Suspense>
                    </LessonBoundary>
                  </section>
                  <SourcePanel lesson={lesson} />
                </div>
              </>
            )
            : (
              <>
                <h1>Lesson not found</h1>
                <a href="#network">Start with network & provider</a>
              </>
            )}
        </main>
        <footer className="page-footer">
          <span>Built with Colibri. Made to be read.</span>
          <span>
            Testnet resets can remove example data. Rerun <code>setup</code>.
          </span>
        </footer>
      </div>
    </>
  );
}
