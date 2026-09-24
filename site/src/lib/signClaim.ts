import type { Signer } from "ethers";
import { CONTRACT_ADDRESS } from "./contract";

export const CLAIM_TYPES = {
  Claim: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export function getClaimDomain(chainId: number) {
  return {
    name: "AleCoin",
    version: "1",
    chainId,
    verifyingContract: CONTRACT_ADDRESS,
  };
}

export async function signClaim(
  signer: Signer,
  chainId: number,
  to: string,
  amount: bigint,
  nonce: bigint,
): Promise<string> {
  const domain = getClaimDomain(chainId);
  return signer.signTypedData(domain, CLAIM_TYPES, { to, amount, nonce });
}
