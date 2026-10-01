import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-amber/50 bg-glow px-4 py-3 text-center text-sm"
    >
      {children}
    </p>
  );
}
