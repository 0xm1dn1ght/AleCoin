export type ClaimLinkParams = {
  to: string;
  amount: bigint;
  nonce: bigint;
  signature: string;
};

export function generateNonce(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return BigInt(hex);
}

export function buildClaimLink(baseUrl: string, params: ClaimLinkParams): string {
  const url = new URL("/claim", baseUrl);
  url.searchParams.set("to", params.to);
  url.searchParams.set("amount", params.amount.toString());
  url.searchParams.set("nonce", params.nonce.toString());
  url.searchParams.set("sig", params.signature);
  return url.toString();
}

export function parseClaimLink(searchParams: URLSearchParams): ClaimLinkParams | null {
  const to = searchParams.get("to");
  const amount = searchParams.get("amount");
  const nonce = searchParams.get("nonce");
  const signature = searchParams.get("sig");

  if (!to || !amount || !nonce || !signature) {
    return null;
  }

  try {
    return {
      to,
      amount: BigInt(amount),
      nonce: BigInt(nonce),
      signature,
    };
  } catch {
    return null;
  }
}
