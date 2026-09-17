import { ColibriError } from "@colibri/core/errors";
import type { PropsWithChildren, ReactNode } from "react";

export function Note({ children }: PropsWithChildren) {
  return <aside className="note">{children}</aside>;
}
export function Field({ label, hint, ...input }: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input spellCheck={false} autoComplete="off" {...input} />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Actions({ children }: PropsWithChildren) {
  return <div className="actions">{children}</div>;
}
export function Failure({ error }: { error: unknown }) {
  if (!error) return null;
  const cause = error instanceof ColibriError
    ? error.meta?.cause
    : error instanceof Error
    ? error.cause
    : undefined;
  // Wallet SDKs may reject with a plain { message, code } object.
  const message = typeof error === "object" && "message" in error &&
      typeof error.message === "string"
    ? error.message
    : String(error);
  return (
    <p className="failure" role="alert">
      {error instanceof ColibriError && <code>{error.code}:</code>}
      {message}
      {cause instanceof Error && (
        <small className="error-cause">{cause.message}</small>
      )}
    </p>
  );
}
export function Value(
  { label, children }: { label: string; children: ReactNode },
) {
  return (
    <div className="value">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
export function Data(
  { value, label = "Returned data" }: { value: unknown; label?: string },
) {
  // Diagnostics never receive signers, connection objects, or session tokens.
  const text = JSON.stringify(
    value,
    (_key, item) => typeof item === "bigint" ? item.toString() : item,
    2,
  );
  return (
    <details className="data">
      <summary>{label}</summary>
      <pre>{text ?? "No result yet."}</pre>
    </details>
  );
}
export function QueryState({ query, children }: PropsWithChildren<{
  query: {
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    data: unknown;
  };
}>) {
  return (
    <section aria-live="polite" className="result">
      <div className="result-label">
        Observation{" "}
        <span>
          {query.isFetching
            ? "Loading"
            : query.isError
            ? "Error"
            : query.data === undefined
            ? "Waiting for input"
            : "Ready"}
        </span>
      </div>
      <Failure error={query.error} />
      {children}
    </section>
  );
}
export function MutationState({ mutation }: {
  mutation: {
    isPending: boolean;
    isSuccess: boolean;
    error: unknown;
    data?: unknown;
  };
}) {
  return (
    <section aria-live="polite" className="result">
      <div className="result-label">
        Action{" "}
        <span>
          {mutation.isPending
            ? "Pending"
            : mutation.isSuccess
            ? "Completed"
            : mutation.error
            ? "Error"
            : "Not started"}
        </span>
      </div>
      <Failure error={mutation.error} />
      {mutation.data !== undefined && <Data value={mutation.data} />}
    </section>
  );
}
