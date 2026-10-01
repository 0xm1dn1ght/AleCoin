import { describe, it, expect } from "vitest";
import { parseAleAmount, parseRecipient, INVALID_AMOUNT, INVALID_ADDRESS } from "../input";

const ALE = 10n ** 18n;

describe("parseAleAmount", () => {
  it("parses a whole number", () => {
    expect(parseAleAmount("5")).toBe(5n * ALE);
  });

  it("accepts a decimal comma from a Russian keyboard", () => {
    expect(parseAleAmount("2,5")).toBe((5n * ALE) / 2n);
  });

  it("ignores surrounding and grouping spaces", () => {
    expect(parseAleAmount(" 1 250 ")).toBe(1250n * ALE);
  });

  it("rejects an empty amount", () => {
    expect(() => parseAleAmount("")).toThrow(INVALID_AMOUNT);
  });

  it("rejects text that is not a number", () => {
    expect(() => parseAleAmount("abc")).toThrow(INVALID_AMOUNT);
  });

  it("rejects zero", () => {
    expect(() => parseAleAmount("0")).toThrow(INVALID_AMOUNT);
  });

  it("rejects negative amounts", () => {
    expect(() => parseAleAmount("-1")).toThrow(INVALID_AMOUNT);
  });
});

describe("parseRecipient", () => {
  it("returns a checksummed address for a valid lowercase address", () => {
    expect(parseRecipient(" 0x58ee5eab40a56e8243cb80139428bbdee3fad70b ")).toBe(
      "0x58EE5eaB40A56e8243cB80139428BBDee3fad70b",
    );
  });

  it("rejects an address that is too short", () => {
    expect(() => parseRecipient("0x58ee5eab")).toThrow(INVALID_ADDRESS);
  });

  it("rejects a name instead of an address", () => {
    expect(() => parseRecipient("anton.eth")).toThrow(INVALID_ADDRESS);
  });
});
