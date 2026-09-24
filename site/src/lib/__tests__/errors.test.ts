import { describe, it, expect } from "vitest";
import { translateError } from "../errors";

describe("translateError", () => {
  it("translates the nonce-already-used revert reason", () => {
    const error = { reason: "AleCoin: nonce already used" };
    expect(translateError(error)).toBe("Эта награда уже была получена.");
  });

  it("translates the invalid-signature revert reason", () => {
    const error = { reason: "AleCoin: invalid signature" };
    expect(translateError(error)).toBe("Ссылка повреждена или недействительна.");
  });

  it("translates a user-rejected action", () => {
    const error = { code: "ACTION_REJECTED" };
    expect(translateError(error)).toBe("Действие отменено.");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(translateError(new Error("boom"))).toBe(
      "Что-то пошло не так. Попробуйте ещё раз чуть позже.",
    );
  });
});
