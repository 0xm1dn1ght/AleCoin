import { describe, it, expect } from "vitest";
import { translateError, isFinalClaimError, describeError } from "../errors";
import { INVALID_AMOUNT, INVALID_ADDRESS } from "../input";

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

  it("translates the MetaMask-not-installed error", () => {
    const error = new Error("MetaMask не установлен");
    expect(translateError(error)).toBe(
      "MetaMask не установлен. Установите расширение или приложение на metamask.io и обновите страницу.",
    );
  });

  it("translates a revert reason nested under shortMessage", () => {
    const error = { shortMessage: "execution reverted: AleCoin: nonce already used" };
    expect(translateError(error)).toBe("Эта награда уже была получена.");
  });
});

describe("isFinalClaimError", () => {
  it("is true when the reward was already claimed", () => {
    expect(isFinalClaimError({ reason: "AleCoin: nonce already used" })).toBe(true);
  });

  it("is true when the signature is invalid", () => {
    expect(
      isFinalClaimError({ shortMessage: "execution reverted: AleCoin: invalid signature" }),
    ).toBe(true);
  });

  it("is false when the user cancelled in MetaMask", () => {
    expect(isFinalClaimError({ code: "ACTION_REJECTED" })).toBe(false);
  });

  it("is false for a network failure", () => {
    expect(isFinalClaimError(new Error("network error: failed to fetch"))).toBe(false);
  });

  it("is false for non-object errors", () => {
    expect(isFinalClaimError("boom")).toBe(false);
  });
});

describe("translateError for form input", () => {
  it("explains an invalid amount", () => {
    expect(translateError(new Error(INVALID_AMOUNT))).toBe(
      "Введите сумму числом больше нуля, например 5 или 2,5.",
    );
  });

  it("explains an invalid address", () => {
    expect(translateError(new Error(INVALID_ADDRESS))).toBe(
      "Проверьте адрес: он начинается с 0x и состоит из 42 символов.",
    );
  });
});

describe("describeError", () => {
  it("pairs the friendly text with the technical details", () => {
    const error = { code: "CALL_EXCEPTION", shortMessage: "execution reverted: AleCoin: nonce already used" };
    expect(describeError(error)).toEqual({
      text: "Эта награда уже была получена.",
      details: "CALL_EXCEPTION: execution reverted: AleCoin: nonce already used",
    });
  });

  it("uses the plain message when there is no error code", () => {
    expect(describeError(new Error("boom")).details).toBe("boom");
  });

  it("keeps details short enough for a phone screen", () => {
    expect(describeError(new Error("x".repeat(5000))).details.length).toBeLessThanOrEqual(600);
  });
});

describe("translateError for gas", () => {
  it("explains that the wallet has no POL for the network fee", () => {
    expect(translateError({ code: "INSUFFICIENT_FUNDS", shortMessage: "insufficient funds" })).toBe(
      "Не хватает POL на оплату комиссии сети. Пополните кошелёк и попробуйте снова.",
    );
  });
});
