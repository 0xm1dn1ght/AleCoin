"use client";

import { useState } from "react";
import { BrowserProvider, Contract, EventLog, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { formatAle } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";
import { Button, BUSY_WALLET, BUSY_NETWORK } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Notice } from "@/components/Notice";
import { Intro } from "./intro";
import { HistoryList, type HistoryEntry } from "./history-list";

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState<string | null>(null);
  const [transferBusy, setTransferBusy] = useState<string | null>(null);

  async function handleConnect() {
    setStatus(null);
    setConnectBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    } finally {
      setConnectBusy(null);
    }
  }

  async function loadAccountData(provider: BrowserProvider, address: string) {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const rawBalance = await contract.balanceOf(address);
    setBalance(formatAle(rawBalance));

    const sent = await contract.queryFilter(contract.filters.Transfer(address, null));
    const received = await contract.queryFilter(contract.filters.Transfer(null, address));
    const rewards = await contract.queryFilter(contract.filters.RewardClaimed(address));

    const rewardTxHashes = new Set(rewards.map((event) => event.transactionHash));
    const receivedWithoutRewards = received.filter(
      (event) => !rewardTxHashes.has(event.transactionHash),
    );

    const entries: HistoryEntry[] = [
      ...sent.map((event) => toTransferEntry(event as EventLog, "sent")),
      ...receivedWithoutRewards.map((event) => toTransferEntry(event as EventLog, "received")),
      ...rewards.map((event) => toRewardEntry(event as EventLog)),
    ];

    entries.sort((a, b) => b.blockNumber - a.blockNumber);
    setHistory(entries);
  }

  function toTransferEntry(event: EventLog, type: "sent" | "received"): HistoryEntry {
    const [from, to, value] = event.args as unknown as [string, string, bigint];
    return {
      type,
      amount: formatAle(value),
      counterparty: type === "sent" ? to : from,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  function toRewardEntry(event: EventLog): HistoryEntry {
    const [, amount] = event.args as unknown as [string, bigint, bigint];
    return {
      type: "reward",
      amount: formatAle(amount),
      counterparty: CONTRACT_ADDRESS,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  async function handleTransfer() {
    setStatus(null);
    setTransferBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(transferTo, parseEther(transferAmount));
      setTransferBusy(BUSY_NETWORK);
      await tx.wait();
      setStatus("Перевод выполнен.");
      const address = await signer.getAddress();
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    } finally {
      setTransferBusy(null);
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
                <Notice>{status}</Notice>
              </div>
            )}
          </>
        )}

        {account && (
          <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
            <div className="grid content-start gap-4">
              <Panel title="Ваш баланс">
                <p className="font-display text-4xl font-semibold sm:text-5xl">
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
                  {status && <Notice>{status}</Notice>}
                </div>
              </Panel>
            </div>
            <Panel title="История операций">
              <HistoryList entries={history} />
            </Panel>
          </div>
        )}
      </main>
    </>
  );
}
