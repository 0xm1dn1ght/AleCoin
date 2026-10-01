import type { ReactNode } from "react";

const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.14em] text-amber";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={LABEL_CLASS}>{children}</p>;
}

export function Panel({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-line bg-card p-5 ${className}`}>
      {title && <h2 className={`mb-3 ${LABEL_CLASS}`}>{title}</h2>}
      {children}
    </section>
  );
}
