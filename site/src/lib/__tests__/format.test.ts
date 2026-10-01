import { describe, it, expect } from "vitest";
import { shortenAddress, formatAle, txUrl } from "../format";

const ALE = 10n ** 18n;

describe("shortenAddress", () => {
  it("keeps the first 6 and last 4 characters of a full address", () => {
    expect(shortenAddress("0x58EE5eaB40A56e8243cB80139428BBDee3fad70b")).toBe("0x58EE…d70b");
  });

  it("returns short strings unchanged", () => {
    expect(shortenAddress("0xabc")).toBe("0xabc");
  });
});

describe("formatAle", () => {
  it("drops the trailing .0 of whole amounts", () => {
    expect(formatAle(999n * ALE)).toBe("999");
  });

  it("groups thousands with non-breaking spaces", () => {
    expect(formatAle(1250n * ALE)).toBe("1\u00a0250");
  });

  it("formats zero as 0", () => {
    expect(formatAle(0n)).toBe("0");
  });

  it("keeps a fractional part without trailing zeros", () => {
    expect(formatAle(ALE / 2n)).toBe("0.5");
  });

  it("formats millions with a fractional part", () => {
    expect(formatAle(1234567n * ALE + 25n * 10n ** 16n)).toBe("1\u00a0234\u00a0567.25");
  });

  it("shows the smallest unit exactly", () => {
    expect(formatAle(1n)).toBe("0.000000000000000001");
  });
});

describe("txUrl", () => {
  it("builds a PolygonScan transaction link", () => {
    expect(txUrl("0xabc")).toBe("https://amoy.polygonscan.com/tx/0xabc");
  });
});
