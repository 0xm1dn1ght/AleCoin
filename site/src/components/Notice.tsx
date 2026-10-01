import type { ReactNode } from "react";

export function Notice({ children, details }: { children: ReactNode; details?: string }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber/50 bg-glow px-4 py-3 text-center text-sm"
    >
      <p>{children}</p>
      {details && (
        <details className="mt-2 text-left">
          <summary className="cursor-pointer text-center text-xs text-muted">Подробнее</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-muted">
            {details}
          </pre>
        </details>
      )}
    </div>
  );
}
