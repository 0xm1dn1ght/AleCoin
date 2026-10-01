import { formatEther } from "ethers";
import { NETWORK } from "./contract";

export function shortenAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAle(wei: bigint): string {
  const [whole, fraction] = formatEther(wei).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${grouped}.${trimmedFraction}` : grouped;
}

export function txUrl(txHash: string): string {
  return `${NETWORK.blockExplorerUrl}/tx/${txHash}`;
}
