const REVERT_MESSAGES: Record<string, string> = {
  "AleCoin: nonce already used": "Эта награда уже была получена.",
  "AleCoin: invalid signature": "Ссылка повреждена или недействительна.",
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

function extractErrorInfo(error: unknown): { code: unknown; text: string } {
  if (error && typeof error === "object") {
    const err = error as { code?: unknown; message?: unknown; reason?: unknown };
    const text = [err.message, err.reason].filter(Boolean).join(" ");
    return { code: err.code, text };
  }
  return { code: undefined, text: String(error) };
}
