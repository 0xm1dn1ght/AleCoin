import { INVALID_ADDRESS, INVALID_AMOUNT } from "./input";

const NONCE_USED_REASON = "AleCoin: nonce already used";
const INVALID_SIGNATURE_REASON = "AleCoin: invalid signature";

const REVERT_MESSAGES: Record<string, string> = {
  [NONCE_USED_REASON]: "Эта награда уже была получена.",
  [INVALID_SIGNATURE_REASON]: "Ссылка повреждена или недействительна.",
  "MetaMask не установлен":
    "MetaMask не установлен. Установите расширение или приложение на metamask.io и обновите страницу.",
  [INVALID_AMOUNT]: "Введите сумму числом больше нуля, например 5 или 2,5.",
  [INVALID_ADDRESS]: "Проверьте адрес: он начинается с 0x и состоит из 42 символов.",
};

const MAX_DETAILS_LENGTH = 600;

export type StatusMessage = {
  text: string;
  details?: string;
};

const DEFAULT_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз чуть позже.";
const USER_REJECTED_MESSAGE = "Действие отменено.";
const NETWORK_MESSAGE = "Не удалось подключиться к сети. Попробуйте ещё раз позже.";
const INSUFFICIENT_FUNDS_MESSAGE =
  "Не хватает POL на оплату комиссии сети. Пополните кошелёк и попробуйте снова.";

export function translateError(error: unknown): string {
  const info = extractErrorInfo(error);

  if (info.code === 4001 || info.code === "ACTION_REJECTED") {
    return USER_REJECTED_MESSAGE;
  }

  if (info.code === "INSUFFICIENT_FUNDS") {
    return INSUFFICIENT_FUNDS_MESSAGE;
  }

  for (const [reason, message] of Object.entries(REVERT_MESSAGES)) {
    if (info.text.includes(reason)) {
      return message;
    }
  }

  if (info.text.toLowerCase().includes("network") || info.text.toLowerCase().includes("fetch")) {
    return NETWORK_MESSAGE;
  }

  return DEFAULT_MESSAGE;
}

export function describeError(error: unknown): Required<StatusMessage> {
  return { text: translateError(error), details: extractErrorDetails(error) };
}

function extractErrorDetails(error: unknown): string {
  let details = String(error);
  if (error && typeof error === "object") {
    const err = error as {
      code?: unknown;
      message?: unknown;
      reason?: unknown;
      shortMessage?: unknown;
      info?: { error?: { message?: unknown } };
      error?: { message?: unknown };
    };
    const parts = [
      err.shortMessage,
      err.info?.error?.message,
      err.error?.message,
      err.reason,
      err.message,
    ].filter((part): part is string => typeof part === "string" && part.length > 0);
    const text = [...new Set(parts)].join(" | ");
    details = err.code !== undefined ? `${String(err.code)}: ${text}` : text;
  }
  return details.slice(0, MAX_DETAILS_LENGTH);
}

const FINAL_CLAIM_REASONS = [NONCE_USED_REASON, INVALID_SIGNATURE_REASON];

export function isFinalClaimError(error: unknown): boolean {
  const { text } = extractErrorInfo(error);
  return FINAL_CLAIM_REASONS.some((reason) => text.includes(reason));
}

function extractErrorInfo(error: unknown): { code: unknown; text: string } {
  if (error && typeof error === "object") {
    const err = error as {
      code?: unknown;
      message?: unknown;
      reason?: unknown;
      shortMessage?: unknown;
      info?: { error?: { message?: unknown } };
      error?: { message?: unknown };
    };
    const text = [
      err.message,
      err.reason,
      err.shortMessage,
      err.info?.error?.message,
      err.error?.message,
    ]
      .filter(Boolean)
      .join(" ");
    return { code: err.code, text };
  }
  return { code: undefined, text: String(error) };
}
