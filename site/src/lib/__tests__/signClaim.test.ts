import { describe, it, expect } from "vitest";
import { Wallet, verifyTypedData } from "ethers";
import { signClaim, getClaimDomain, CLAIM_TYPES } from "../signClaim";

describe("signClaim", () => {
  it("produces a signature that recovers to the signer's address", async () => {
    const wallet = Wallet.createRandom();
    const chainId = 80002;
    const to = "0x00000000000000000000000000000000000000f1";
    const amount = 50n * 10n ** 18n;
    const nonce = 12345n;

    const signature = await signClaim(wallet, chainId, to, amount, nonce);

    const recovered = verifyTypedData(
      getClaimDomain(chainId),
      CLAIM_TYPES,
      { to, amount, nonce },
      signature,
    );

    expect(recovered).toBe(wallet.address);
  });

  it("produces different signatures for different signers over the same data", async () => {
    const walletA = Wallet.createRandom();
    const walletB = Wallet.createRandom();
    const chainId = 80002;
    const to = "0x00000000000000000000000000000000000000f1";
    const amount = 1n;
    const nonce = 1n;

    const sigA = await signClaim(walletA, chainId, to, amount, nonce);
    const sigB = await signClaim(walletB, chainId, to, amount, nonce);

    expect(sigA).not.toBe(sigB);
  });
});
