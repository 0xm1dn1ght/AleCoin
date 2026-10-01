"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError, isFinalClaimError } from "@/lib/errors";
import { parseClaimLink } from "@/lib/claimLink";
import { formatAle, shortenAddress, txUrl } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel, Eyebrow } from "@/components/Panel";
import { Button, BUSY_WALLET, BUSY_NETWORK } from "@/components/Button";
import { Notice } from "@/components/Notice";

export function ClaimView() {
  const searchParams = useSearchParams();
  const claim = parseClaimLink(searchParams);
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [finalError, setFinalError] = useState(false);

  if (!claim) {
    return (
      <ClaimShell account={account}>
        <h1 className="font-display text-2xl font-semibold">Ссылка повреждена</h1>
        <p className="mt-2 text-muted">
          Проверьте, что ссылка скопирована целиком, или попросите новую.
        </p>
        <HomeLink />
      </ClaimShell>
    );
  }

  const { to, amount, nonce, signature } = claim;

  async function handleClaim() {
    setStatus(null);
    setFinalError(false);
    setBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimReward(to, amount, nonce, signature);
      setBusy(BUSY_NETWORK);
      await tx.wait();
      setClaimTxHash(tx.hash);
    } catch (error) {
      setStatus(translateError(error));
      setFinalError(isFinalClaimError(error));
    } finally {
      setBusy(null);
    }
  }

  if (claimTxHash) {
    return (
      <ClaimShell account={account}>
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-glow text-2xl text-amber"
        >
          ✓
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Токены получены!</h1>
        <p className="mt-2 text-muted">{formatAle(amount)} ALE уже в вашем кошельке</p>
        <a
          href={txUrl(claimTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-amber hover:underline"
        >
          Посмотреть транзакцию →
        </a>
        <HomeLink />
      </ClaimShell>
    );
  }

  const amountTone = finalError ? "opacity-50" : "";

  return (
    <ClaimShell account={account}>
      <Eyebrow>Вам награда</Eyebrow>
      <h1 className={`mt-3 break-all font-display text-6xl font-semibold text-amber ${amountTone}`}>
        {formatAle(amount)}
      </h1>
      <p className={`font-display text-xl ${amountTone}`}>ALE</p>
      <p className="mt-4 text-sm text-muted">
        на адрес <span className="font-mono">{shortenAddress(to)}</span>
      </p>
      {status && (
        <div className="mt-6">
          <Notice>{status}</Notice>
        </div>
      )}
      {!finalError && (
        <Button onClick={handleClaim} busy={busy} className="mt-6 w-full text-lg">
          Получить
        </Button>
      )}
    </ClaimShell>
  );
}

function ClaimShell({ account, children }: { account: string | null; children: ReactNode }) {
  return (
    <>
      <SiteHeader account={account} />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-sm px-6 py-8 text-center">{children}</Panel>
      </main>
    </>
  );
}

function HomeLink() {
  return (
    <Link href="/" className="mt-4 block text-sm text-muted hover:text-cream">
      На главную
    </Link>
  );
}
