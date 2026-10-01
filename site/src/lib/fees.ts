import { parseUnits } from "ethers";
import { createReadProvider } from "./rpc";

// Polygon rejects transactions whose tip is below its floor (25 gwei on Amoy), while
// MetaMask mobile defaults to 1.5 gwei, so the site always suggests the fees itself.
export const MIN_PRIORITY_FEE = parseUnits("30", "gwei");

export type FeeOverrides = {
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
};

export function computeFees(baseFee: bigint, suggestedTip: bigint): FeeOverrides {
  const tip = suggestedTip > MIN_PRIORITY_FEE ? suggestedTip : MIN_PRIORITY_FEE;
  return { maxPriorityFeePerGas: tip, maxFeePerGas: baseFee * 2n + tip };
}

export async function getFeeOverrides(): Promise<FeeOverrides> {
  const provider = createReadProvider();
  const block = await provider.getBlock("latest");
  let suggestedTip = MIN_PRIORITY_FEE;
  try {
    suggestedTip = BigInt(await provider.send("eth_maxPriorityFeePerGas", []));
  } catch {
    // Not every RPC supports this method; the minimum tip is still accepted by the network.
  }
  return computeFees(block?.baseFeePerGas ?? 0n, suggestedTip);
}
