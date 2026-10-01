import { getAddress, isAddress, parseEther } from "ethers";

export const INVALID_AMOUNT = "Неверная сумма";
export const INVALID_ADDRESS = "Неверный адрес";

export function parseAleAmount(input: string): bigint {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  let amount: bigint;
  try {
    amount = parseEther(normalized);
  } catch {
    throw new Error(INVALID_AMOUNT);
  }
  if (amount <= 0n) {
    throw new Error(INVALID_AMOUNT);
  }
  return amount;
}

export function parseRecipient(input: string): string {
  const trimmed = input.trim();
  if (!isAddress(trimmed)) {
    throw new Error(INVALID_ADDRESS);
  }
  return getAddress(trimmed);
}
