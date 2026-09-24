import { BrowserProvider } from "ethers";
import { NETWORK } from "./contract";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function hasWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function connectWallet(): Promise<BrowserProvider> {
  if (!hasWallet()) {
    throw new Error("MetaMask не установлен");
  }
  const provider = new BrowserProvider(window.ethereum!);
  await provider.send("eth_requestAccounts", []);
  await ensureNetwork(provider);
  return provider;
}

export async function ensureNetwork(provider: BrowserProvider): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) === NETWORK.chainId) {
    return;
  }

  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: NETWORK.chainIdHex },
    ]);
  } catch (error) {
    const switchError = error as { code?: number };
    if (switchError.code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: NETWORK.chainIdHex,
          chainName: NETWORK.chainName,
          rpcUrls: [NETWORK.rpcUrl],
          blockExplorerUrls: [NETWORK.blockExplorerUrl],
          nativeCurrency: NETWORK.nativeCurrency,
        },
      ]);
    } else {
      throw error;
    }
  }
}
