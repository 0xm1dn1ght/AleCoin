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

  const { to, amount, nonce, signature } = claim;

  async function handleClaim() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimReward(to, amount, nonce, signature);
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
        Вам полагается {formatEther(amount)} ALE на адрес {to}.
      </p>
      {!claimed && <button onClick={handleClaim}>Получить</button>}
      {status && <p>{status}</p>}
    </main>
  );
}
