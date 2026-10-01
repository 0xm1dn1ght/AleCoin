import Link from "next/link";
import { CoinLogo } from "./CoinLogo";
import { Button } from "./Button";
import { shortenAddress } from "@/lib/format";

type SiteHeaderProps = {
  account?: string | null;
  onConnect?: () => void;
  connectBusy?: string | null;
};

export function SiteHeader({ account, onConnect, connectBusy = null }: SiteHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <CoinLogo />
          <span className="font-display text-xl font-extrabold text-amber">AleCoin</span>
        </Link>
        {account ? (
          <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-amber" aria-hidden="true" />
            {shortenAddress(account)}
          </span>
        ) : (
          onConnect && (
            <div className="hidden sm:block">
              <Button variant="secondary" onClick={onConnect} busy={connectBusy} className="text-sm">
                Подключить кошелёк
              </Button>
            </div>
          )
        )}
      </div>
    </header>
  );
}
