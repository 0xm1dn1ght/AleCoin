import { describe, it, expect } from "vitest";
import { generateNonce, buildClaimLink, parseClaimLink } from "../claimLink";

describe("generateNonce", () => {
  it("produces a 256-bit non-negative integer", () => {
    const nonce = generateNonce();
    expect(nonce).toBeGreaterThanOrEqual(0n);
    expect(nonce).toBeLessThan(2n ** 256n);
  });

  it("produces different values on repeated calls", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

describe("buildClaimLink / parseClaimLink", () => {
  it("round-trips claim parameters through a URL", () => {
    const params = {
      to: "0x000000000000000000000000000000000000f1",
      amount: 50n * 10n ** 18n,
      nonce: 12345n,
      signature: "0xabc123",
    };

    const link = buildClaimLink("https://example.com/AleCoin", params);
    const url = new URL(link);
    const parsed = parseClaimLink(url.searchParams);

    expect(parsed).toEqual(params);
  });

  it("returns null when a required parameter is missing", () => {
    const url = new URL("https://example.com/AleCoin/claim?to=0xabc&amount=1");
    expect(parseClaimLink(url.searchParams)).toBeNull();
  });

  it("returns null when a numeric parameter is not a valid integer", () => {
    const url = new URL(
      "https://example.com/AleCoin/claim?to=0xabc&amount=abc&nonce=1&sig=0x1",
    );
    expect(parseClaimLink(url.searchParams)).toBeNull();
  });
});
