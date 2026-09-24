"use client";

import { useState } from "react";
import { parseEther } from "ethers";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { generateNonce, buildClaimLink } from "@/lib/claimLink";
import { signClaim } from "@/lib/signClaim";
import { BASE_PATH } from "@/lib/contract";

export function AdminForm() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreate() {
    setStatus(null);
    setLink(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      const amountWei = parseEther(amount);
      const nonce = generateNonce();

      const signature = await signClaim(
        signer,
        Number(network.chainId),
        to,
        amountWei,
        nonce,
      );

      const claimLink = buildClaimLink(window.location.origin + BASE_PATH, {
        to,
        amount: amountWei,
        nonce,
        signature,
      });

      setLink(claimLink);
      setStatus("Ссылка готова.");
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <>
      <input
        placeholder="Адрес друга"
        value={to}
        onChange={(event) => setTo(event.target.value)}
      />
      <input
        placeholder="Сумма ALE"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <button onClick={handleCreate}>Создать награду</button>

      {link && (
        <p>
          <input readOnly value={link} onFocus={(event) => event.target.select()} />
        </p>
      )}
      {status && <p>{status}</p>}
    </>
  );
}
