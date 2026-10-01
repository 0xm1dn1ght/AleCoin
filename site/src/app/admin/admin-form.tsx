"use client";

import { useEffect, useRef, useState } from "react";
import { connectWallet } from "@/lib/wallet";
import { describeError, type StatusMessage } from "@/lib/errors";
import { parseAleAmount, parseRecipient } from "@/lib/input";
import { generateNonce, buildClaimLink } from "@/lib/claimLink";
import { signClaim } from "@/lib/signClaim";
import { BASE_PATH } from "@/lib/contract";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";
import { Button, BUSY_WALLET } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Notice } from "@/components/Notice";

const COPY_LABEL = "Скопировать";

export function AdminForm() {
  const [account, setAccount] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState(COPY_LABEL);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => cancelCopyReset, []);

  function cancelCopyReset() {
    if (copyResetTimer.current !== null) {
      clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
  }

  async function handleCreate() {
    setStatus(null);
    setLink(null);
    cancelCopyReset();
    setBusy(BUSY_WALLET);
    try {
      const recipient = parseRecipient(to);
      const amountWei = parseAleAmount(amount);

      const provider = await connectWallet();
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      const network = await provider.getNetwork();

      const nonce = generateNonce();

      const signature = await signClaim(
        signer,
        Number(network.chainId),
        recipient,
        amountWei,
        nonce,
      );

      const claimLink = buildClaimLink(window.location.origin + BASE_PATH, {
        to: recipient,
        amount: amountWei,
        nonce,
        signature,
      });

      setLink(claimLink);
      setCopyLabel(COPY_LABEL);
    } catch (error) {
      setStatus(describeError(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    if (!link) {
      return;
    }
    cancelCopyReset();
    try {
      await navigator.clipboard.writeText(link);
      setCopyLabel("Скопировано");
      copyResetTimer.current = setTimeout(() => {
        copyResetTimer.current = null;
        setCopyLabel(COPY_LABEL);
      }, 2000);
    } catch {
      setCopyLabel("Не получилось — выделите ссылку вручную");
    }
  }

  return (
    <>
      <SiteHeader account={account} />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold">Выдача наград</h1>
          <div className="mt-5 grid gap-3">
            <TextField
              label="Адрес друга"
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <TextField
              label="Сумма ALE"
              placeholder="0"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Button onClick={handleCreate} busy={busy} className="mt-1 w-full">
              Создать награду
            </Button>
          </div>

          {status && (
            <div className="mt-5">
              <Notice details={status.details}>{status.text}</Notice>
            </div>
          )}

          {link && (
            <div className="mt-6 rounded-lg border border-amber/50 p-4">
              <p className="text-sm text-muted">Ссылка готова — отправьте её другу:</p>
              <textarea
                readOnly
                rows={5}
                value={link}
                aria-label="Ссылка на награду"
                onFocus={(event) => {
                  event.target.select();
                  event.target.setSelectionRange(0, event.target.value.length);
                }}
                className="mt-2 w-full resize-none break-all rounded-md border border-line bg-transparent px-3 py-2 font-mono text-sm text-cream focus:border-amber focus:outline-none"
              />
              <Button variant="secondary" onClick={handleCopy} className="mt-3 w-full">
                {copyLabel}
              </Button>
            </div>
          )}
        </Panel>
      </main>
    </>
  );
}
