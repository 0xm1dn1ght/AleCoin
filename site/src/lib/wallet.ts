import { BrowserProvider } from "ethers";
import { NETWORK } from "./contract";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: () => void) => void;
      removeListener?: (event: string, listener: () => void) => void;
    };
  }
}

const WALLET_EVENTS = ["accountsChanged", "chainChanged"];

function hasWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function watchWallet(onChange: () => void): () => void {
  const ethereum = hasWallet() ? window.ethereum : undefined;
  if (!ethereum?.on) {
    return () => {};
  }
  for (const event of WALLET_EVENTS) {
    ethereum.on(event, onChange);
  }
  return () => {
    for (const event of WALLET_EVENTS) {
      ethereum.removeListener?.(event, onChange);
    }
  };
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
