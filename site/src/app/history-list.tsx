import { shortenAddress, txUrl } from "@/lib/format";
import type { HistoryEntry } from "@/lib/history";
import { Notice } from "@/components/Notice";

const ICONS: Record<HistoryEntry["type"], string> = {
  reward: "★",
  sent: "↑",
  received: "↓",
};

function describeEntry(entry: HistoryEntry): string {
  if (entry.type === "reward") {
    return "Награда";
  }
  if (entry.type === "sent") {
    return `Отправлено ${shortenAddress(entry.counterparty)}`;
  }
  return `Получено от ${shortenAddress(entry.counterparty)}`;
}

type HistoryListProps = {
  entries: HistoryEntry[] | null;
  errorDetails: string | null;
};

export function HistoryList({ entries, errorDetails }: HistoryListProps) {
  if (errorDetails !== null) {
    return (
      <Notice details={errorDetails}>
        Не удалось загрузить историю. Обновите страницу чуть позже.
      </Notice>
    );
  }
  if (entries === null) {
    return <p className="text-muted">Загрузка…</p>;
  }
  if (entries.length === 0) {
    return <p className="text-muted">Операций пока нет.</p>;
  }

  return (
    <>
      <ul>
        {entries.map((entry) => (
          <li key={entry.txHash + entry.type} className="border-t border-line first:border-t-0">
            <a
              href={txUrl(entry.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-between gap-3 py-2.5 hover:text-amber"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm ${
                    entry.type === "reward" ? "bg-glow text-amber" : "bg-card"
                  }`}
                >
                  {ICONS[entry.type]}
                </span>
                <span className="truncate">{describeEntry(entry)}</span>
              </span>
              <span
                className={`flex-none font-semibold ${entry.type === "sent" ? "" : "text-amber"}`}
              >
                {entry.type === "sent" ? "−" : "+"} {entry.amount} ALE
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Нажмите на операцию, чтобы открыть её в PolygonScan.</p>
    </>
  );
}
