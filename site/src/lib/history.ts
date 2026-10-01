import { JsonRpcProvider, id, zeroPadValue } from "ethers";
import { createReadProvider } from "./rpc";
import { CONTRACT_ADDRESS } from "./contract";
import { formatAle } from "./format";

export type HistoryEntry = {
  type: "sent" | "received" | "reward";
  amount: string;
  counterparty: string;
  txHash: string;
  blockNumber: number;
};

export type AssetTransfer = {
  blockNum: string;
  hash: string;
  from: string;
  to: string;
  rawContract: { value: string };
};

export const REWARD_CLAIMED_TOPIC = id("RewardClaimed(address,uint256,uint256)");

const MAX_TRANSFERS = "0x64";

export function buildHistory(
  sent: AssetTransfer[],
  received: AssetTransfer[],
  rewardTxHashes: Set<string>,
): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    ...sent.map((transfer) => toEntry(transfer, "sent", transfer.to)),
    ...received.map((transfer) =>
      rewardTxHashes.has(transfer.hash.toLowerCase())
        ? toEntry(transfer, "reward", CONTRACT_ADDRESS)
        : toEntry(transfer, "received", transfer.from),
    ),
  ];
  return entries.sort((a, b) => b.blockNumber - a.blockNumber);
}

function toEntry(
  transfer: AssetTransfer,
  type: HistoryEntry["type"],
  counterparty: string,
): HistoryEntry {
  return {
    type,
    amount: formatAle(BigInt(transfer.rawContract.value)),
    counterparty,
    txHash: transfer.hash,
    blockNumber: Number(transfer.blockNum),
  };
}

// History goes straight to Alchemy instead of through the wallet: the free tier caps
// eth_getLogs at 10 blocks, so the full history comes from alchemy_getAssetTransfers.
export async function fetchHistory(account: string): Promise<HistoryEntry[]> {
  const provider = createReadProvider();
  const [sent, received] = await Promise.all([
    queryTransfers(provider, { fromAddress: account }),
    queryTransfers(provider, { toAddress: account }),
  ]);
  const rewardTxHashes = await findRewardTxHashes(provider, account, received);
  return buildHistory(sent, received, rewardTxHashes);
}

async function queryTransfers(
  provider: JsonRpcProvider,
  filter: { fromAddress: string } | { toAddress: string },
): Promise<AssetTransfer[]> {
  const result = (await provider.send("alchemy_getAssetTransfers", [
    {
      fromBlock: "0x0",
      toBlock: "latest",
      contractAddresses: [CONTRACT_ADDRESS],
      category: ["erc20"],
      order: "desc",
      maxCount: MAX_TRANSFERS,
      ...filter,
    },
  ])) as { transfers: AssetTransfer[] };
  return result.transfers;
}

async function findRewardTxHashes(
  provider: JsonRpcProvider,
  account: string,
  received: AssetTransfer[],
): Promise<Set<string>> {
  const blocks = [...new Set(received.map((transfer) => Number(transfer.blockNum)))];
  const hashes = new Set<string>();
  for (const block of blocks) {
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: [REWARD_CLAIMED_TOPIC, zeroPadValue(account, 32)],
      fromBlock: block,
      toBlock: block,
    });
    for (const log of logs) {
      hashes.add(log.transactionHash.toLowerCase());
    }
  }
  return hashes;
}
