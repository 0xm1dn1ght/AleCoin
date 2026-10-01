const NONCE_USED_REASON = "AleCoin: nonce already used";
const INVALID_SIGNATURE_REASON = "AleCoin: invalid signature";

const REVERT_MESSAGES: Record<string, string> = {
  [NONCE_USED_REASON]: "Эта награда уже была получена.",
  [INVALID_SIGNATURE_REASON]: "Ссылка повреждена или недействительна.",
  "MetaMask не установлен":
    "MetaMask не установлен. Установите расширение или приложение на metamask.io и обновите страницу.",
};

const DEFAULT_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз чуть позже.";
const USER_REJECTED_MESSAGE = "Действие отменено.";
const NETWORK_MESSAGE = "Не удалось подключиться к сети. Попробуйте ещё раз позже.";

export function translateError(error: unknown): string {
  const info = extractErrorInfo(error);

  if (info.code === 4001 || info.code === "ACTION_REJECTED") {
    return USER_REJECTED_MESSAGE;
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
