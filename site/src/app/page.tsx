"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { describeError, type StatusMessage } from "@/lib/errors";
import { formatAle } from "@/lib/format";
import { fetchHistory, type HistoryEntry } from "@/lib/history";
import { parseAleAmount, parseRecipient } from "@/lib/input";
import { getFeeOverrides } from "@/lib/fees";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";
import { Button, BUSY_WALLET, BUSY_NETWORK } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Notice } from "@/components/Notice";
import { Intro } from "./intro";
import { HistoryList } from "./history-list";

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [connectBusy, setConnectBusy] = useState<string | null>(null);
  const [transferBusy, setTransferBusy] = useState<string | null>(null);

  async function handleConnect() {
    setStatus(null);
    setConnectBusy(BUSY_WALLET);
    let connected = false;
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      connected = true;
      await loadAccountData(provider, address);
    } catch (error) {
      if (!connected) {
        setStatus(describeError(error));
      }
    } finally {
      setConnectBusy(null);
    }
  }

  async function loadAccountData(provider: BrowserProvider, address: string) {
    setHistoryError(null);
    try {
      await fetchAccountData(provider, address);
    } catch (error) {
      setHistoryError(describeError(error).details);
      throw error;
    }
  }

  async function fetchAccountData(provider: BrowserProvider, address: string) {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const rawBalance = await contract.balanceOf(address);
    setBalance(formatAle(rawBalance));

    setHistory(await fetchHistory(address));
  }

  async function handleTransfer() {
    setStatus(null);
    setTransferBusy(BUSY_WALLET);
    let provider: BrowserProvider;
    let address: string;
    try {
      provider = await connectWallet();
      const signer = await provider.getSigner();
      address = await signer.getAddress();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(
        parseRecipient(transferTo),
        parseAleAmount(transferAmount),
        await getFeeOverrides(),
      );
      setTransferBusy(BUSY_NETWORK);
      await tx.wait();
    } catch (error) {
      setStatus(describeError(error));
      return;
    } finally {
      setTransferBusy(null);
    }

    setStatus({ text: "Перевод выполнен." });
    try {
      await loadAccountData(provider, address);
    } catch {
      // The transfer itself succeeded; a failed refresh is shown in the history panel.
    }
  }

  return (
    <>
      <SiteHeader account={account} onConnect={handleConnect} connectBusy={connectBusy} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        {!account && (
          <>
            <Intro onConnect={handleConnect} connectBusy={connectBusy} />
            {status && (
              <div className="mt-6">
                <Notice details={status.details}>{status.text}</Notice>
              </div>
            )}
          </>
        )}

        {account && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
              <Panel title="Ваш баланс">
                <p
                  className={`break-all font-display font-semibold ${
                    (balance ?? "").length > 7 ? "text-3xl" : "text-4xl sm:text-5xl"
                  }`}
                >
                  {balance ?? "…"} <span className="text-amber">ALE</span>
                </p>
              </Panel>
              <Panel title="Перевести токены">
                <div className="grid gap-3">
                  <TextField
                    label="Адрес получателя"
                    placeholder="0x…"
                    autoComplete="off"
                    spellCheck={false}
                    value={transferTo}
                    onChange={(event) => setTransferTo(event.target.value)}
                  />
                  <TextField
                    label="Сумма ALE"
                    placeholder="0"
                    inputMode="decimal"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                  />
                  <Button onClick={handleTransfer} busy={transferBusy} className="mt-1 w-full">
                    Отправить
                  </Button>
                  {status && <Notice details={status.details}>{status.text}</Notice>}
                </div>
              </Panel>
            </div>
            <Panel title="История операций">
              <HistoryList entries={history} errorDetails={historyError} />
            </Panel>
          </div>
        )}
      </main>
    </>
  );
}
