"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Contract, formatEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { parseClaimLink } from "@/lib/claimLink";

export function ClaimView() {
  const searchParams = useSearchParams();
  const claim = parseClaimLink(searchParams);
  const [status, setStatus] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  if (!claim) {
    return <p>Ссылка повреждена.</p>;
  }

  async function handleClaim() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      // Non-null assertions: TS doesn't retain the `if (!claim) return` narrowing
      // across this closure boundary, even though `claim` is a const.
      const tx = await contract.claimReward(
        claim!.to,
        claim!.amount,
        claim!.nonce,
        claim!.signature,
      );
      await tx.wait();
      setClaimed(true);
      setStatus("Токены получены!");
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <main>
      <h1>AleCoin — получить награду</h1>
      <p>
        Вам полагается {formatEther(claim.amount)} ALE на адрес {claim.to}.
      </p>
      {!claimed && <button onClick={handleClaim}>Получить</button>}
      {status && <p>{status}</p>}
    </main>
  );
}
