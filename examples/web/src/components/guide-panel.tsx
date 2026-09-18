import type { Lesson } from "../app/catalog.ts";
import {
  docsBase,
  hookDescriptions,
  hookDocumentation,
} from "../app/hook-reference.ts";

export type LessonGuide = {
  purpose: string;
  steps: string[];
  outcome: string;
  docs: { label: string; path: string }[];
};

// The explanation lives beside its runnable example. No source is rendered
// in the interface; the repository remains the place to read the complete code.
const guides = import.meta.glob<LessonGuide>("../examples/**/*.guide.ts", {
  import: "default",
  eager: true,
});

export function GuidePanel({ lesson }: { lesson: Lesson }) {
  const guide = guides[`../examples/${lesson.file}.guide.ts`];
  return (
    <aside className="guide-panel" aria-label="Example explanation">
      <h2>What this example does</h2>
      <p>{guide.purpose}</p>
      <h3>Steps</h3>
      <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <h3>Expected result</h3>
      <p>{guide.outcome}</p>
      {lesson.hooks.length > 0 && (
        <>
          <h3>Hooks used</h3>
          <dl className="hook-descriptions">
            {lesson.hooks.map((hook) => (
              <div key={hook}>
                <dt>
                  <a
                    href={hookDocumentation(hook)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <code>{hook}</code>
                  </a>
                </dt>
                <dd>{hookDescriptions[hook]}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {guide.docs.length > 0 && (
        <>
          <h3>Related Colibri documentation</h3>
          <ul>
            {guide.docs.map((doc) => (
              <li key={doc.path}>
                <a
                  href={`${docsBase}/${doc.path}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {doc.label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
