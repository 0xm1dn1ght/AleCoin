"use client";

import { useState } from "react";
import { BrowserProvider, Contract, EventLog, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";

type HistoryEntry = {
  type: "sent" | "received" | "reward";
  amount: string;
  counterparty: string;
  txHash: string;
  blockNumber: number;
};

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleConnect() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  async function loadAccountData(provider: BrowserProvider, address: string) {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const rawBalance = await contract.balanceOf(address);
    setBalance(formatEther(rawBalance));

    const sent = await contract.queryFilter(contract.filters.Transfer(address, null));
    const received = await contract.queryFilter(contract.filters.Transfer(null, address));
    const rewards = await contract.queryFilter(contract.filters.RewardClaimed(address));

    const entries: HistoryEntry[] = [
      ...sent.map((event) => toTransferEntry(event as EventLog, "sent")),
      ...received.map((event) => toTransferEntry(event as EventLog, "received")),
      ...rewards.map((event) => toRewardEntry(event as EventLog)),
    ];

    entries.sort((a, b) => b.blockNumber - a.blockNumber);
    setHistory(entries);
  }

  function toTransferEntry(event: EventLog, type: "sent" | "received"): HistoryEntry {
    const [from, to, value] = event.args as unknown as [string, string, bigint];
    return {
      type,
      amount: formatEther(value),
      counterparty: type === "sent" ? to : from,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  function toRewardEntry(event: EventLog): HistoryEntry {
    const [, amount] = event.args as unknown as [string, bigint, bigint];
    return {
      type: "reward",
      amount: formatEther(amount),
      counterparty: CONTRACT_ADDRESS,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  async function handleTransfer() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(transferTo, parseEther(transferAmount));
      await tx.wait();
      setStatus("Перевод выполнен.");
      const address = await signer.getAddress();
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <main>
      <h1>AleCoin</h1>

      {!account && (
        <>
          <button onClick={handleConnect}>Подключить кошелёк</button>
          <p>
            Получили ссылку на награду? Она открывается на отдельной странице.
            Если ссылки нет — напишите владельцу в Telegram.
          </p>
        </>
      )}

      {account && (
        <>
          <p>Адрес: {account}</p>
          <p>Баланс: {balance ?? "…"} ALE</p>

          <h2>Перевести токены</h2>
          <input
            placeholder="Адрес получателя"
            value={transferTo}
            onChange={(event) => setTransferTo(event.target.value)}
          />
          <input
            placeholder="Сумма ALE"
            value={transferAmount}
            onChange={(event) => setTransferAmount(event.target.value)}
          />
          <button onClick={handleTransfer}>Отправить</button>

          <h2>История</h2>
          <ul>
            {history.map((entry) => (
              <li key={entry.txHash + entry.type}>
                {entry.type === "sent" &&
                  `Отправлено ${entry.amount} ALE → ${entry.counterparty}`}
                {entry.type === "received" &&
                  `Получено ${entry.amount} ALE от ${entry.counterparty}`}
                {entry.type === "reward" && `Получена награда ${entry.amount} ALE`}
              </li>
            ))}
          </ul>
        </>
      )}

      {status && <p>{status}</p>}
    </main>
  );
}
