# План реализации: сайт AleCoin

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: используйте superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для выполнения плана по задачам. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Собрать статический сайт AleCoin (главная страница, страница получения награды, скрытая админ-страница) на Next.js, подключить к уже задеплоенному контракту в Amoy, и настроить автодеплой на GitHub Pages.

**Архитектура:** Next.js (App Router, TypeScript) со статическим экспортом (`output: "export"`), без backend — вся работа с блокчейном идёт напрямую из браузера через ethers.js v6 и MetaMask. Общая логика (адрес/ABI контракта, генерация nonce, сборка ссылок, EIP-712 подпись, перевод текста ошибок) вынесена в модули `src/lib/`, у каждого — свой набор тестов на Vitest. Три страницы (`/`, `/claim`, `/admin`) используют эти модули.

**Тех. стек:** Next.js (App Router), TypeScript, ethers.js v6, Vitest, GitHub Actions (деплой на GitHub Pages).

**Спецификация:** `docs/superpowers/specs/2026-09-24-alecoin-site-design.md`

## Общие ограничения

- Весь пользовательский текст интерфейса и сообщения об ошибках — **на русском языке** (спека: «Локализация»).
- Работа с блокчейном — напрямую через **ethers.js v6**, без wagmi/RainbowKit (согласовано в брейнсторминге).
- RPC — Alchemy-ключ `https://polygon-amoy.g.alchemy.com/v2/alch__BseOViqmTEQINk_lYPHs`, ограниченный по домену сайта в личном кабинете Alchemy (согласовано в брейнсторминге; публичный RPC Polygon не используется — показал ненадёжную доступность).
- История операций на главной странице — **только своя** (где подключённый адрес — отправитель или получатель), не общая лента (спека: «Страницы сайта»).
- `/admin` — скрытый маршрут: не в навигации, `noindex` в метаданных страницы, `Disallow` в `robots.txt` (спека: «Страницы сайта»).
- Никакого backend-сервера и базы данных — весь код выполняется в браузере (спека: «Архитектура и стек»).
- Адрес контракта на Amoy: `0x44e8b28c3b059EeAb4C84d78bffe1808067997b5` (уже задеплоен, см. `docs/superpowers/plans/2026-09-21-alecoin-smart-contract.md`).
- Формат EIP-712 подписи должен **точно** совпадать с тем, что проверяет контракт: домен `{ name: "AleCoin", version: "1", chainId, verifyingContract }`, тип `Claim(address to,uint256 amount,uint256 nonce)` (см. `contracts/AleCoin.sol`, задача 3 плана контракта).
- Хостинг — GitHub Pages, автодеплой через GitHub Actions (спека: «Архитектура и стек», по аналогии с проектом #1 «0x Coffee»).
- Репозиторий — `0xm1dn1ght/AleCoin`, сайт будет жить по адресу `https://0xm1dn1ght.github.io/AleCoin/`.
- Без комментариев в коде, кроме случаев, где WHY действительно не очевиден.

---

## Структура файлов

```
AleCoin/
  .github/
    workflows/
      deploy-site.yml         # автодеплой сайта на GitHub Pages
  site/                        # Next.js проект (отдельно от Hardhat-проекта в корне)
    package.json
    next.config.mjs             # output: export, basePath: /AleCoin
    vitest.config.ts
    public/
      robots.txt                 # запрет индексации /AleCoin/admin
    src/
      app/
        layout.tsx
        globals.css
        page.tsx                   # "/" — главная
        claim/
          page.tsx                   # "/claim" — обёртка с Suspense
          claim-view.tsx              # сама логика страницы claim
        admin/
          page.tsx                   # "/admin" — метаданные noindex
          admin-form.tsx              # сама форма админки
      lib/
        contract.ts                # адрес/ABI контракта, сеть, BASE_PATH
        claimLink.ts                # nonce, сборка/разбор ссылки-приглашения
        signClaim.ts                # EIP-712 домен/типы, функция подписи
        errors.ts                  # перевод ошибок на русский
        wallet.ts                   # подключение кошелька, проверка/смена сети
        __tests__/
          claimLink.test.ts
          signClaim.test.ts
          errors.test.ts
```

---

### Task 1: Каркас проекта Next.js и автодеплой на GitHub Pages

**Файлы:**
- Создать: `site/` (весь каркас через `create-next-app`)
- Модифицировать: `site/next.config.mjs`
- Создать: `site/vitest.config.ts`
- Создать: `.github/workflows/deploy-site.yml`

**Интерфейсы:**
- Результат: рабочий Next.js проект в `site/`, где `npm run build` собирает статический экспорт в `site/out/`, и `npm test` запускает Vitest (пока без тестов — появятся в следующих задачах). От этого зависят все следующие задачи.

- [ ] **Шаг 1: Создать проект Next.js**

Выполнить из `D:\rxr\MyProject\AleCoin`:

```bash
npx create-next-app@latest site --typescript --app --src-dir --import-alias "@/*" --eslint --no-tailwind --use-npm --disable-git
```

`--disable-git` — чтобы create-next-app не пытался создать вложенный git-репозиторий внутри уже существующего.

- [ ] **Шаг 2: Установить ethers и Vitest**

```bash
cd site
npm install ethers
npm install --save-dev vitest
cd ..
```

- [ ] **Шаг 3: Настроить статический экспорт с basePath**

Заменить содержимое `site/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/AleCoin",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Шаг 4: Настроить Vitest**

Создать `site/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

Добавить в `site/package.json` в блок `"scripts"` (рядом с уже существующими `dev`/`build`/`start`/`lint`):

```json
"test": "vitest run"
```

- [ ] **Шаг 5: Проверить сборку**

```bash
cd site
npm run build
cd ..
```

Ожидается: команда завершается без ошибок, появляется файл `site/out/index.html`.

- [ ] **Шаг 6: Написать workflow автодеплоя**

Создать `.github/workflows/deploy-site.yml`:

```yaml
name: Deploy site to GitHub Pages

on:
  push:
    branches: [master]
    paths: ["site/**", ".github/workflows/deploy-site.yml"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: site/package-lock.json
      - name: Install dependencies
        working-directory: site
        run: npm ci
      - name: Run tests
        working-directory: site
        run: npm test
      - name: Build
        working-directory: site
        run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Шаг 7: Коммит**

```bash
git add site .github/workflows/deploy-site.yml
git commit -m "$(cat <<'EOF'
Scaffold Next.js site project with static export and GitHub Pages deploy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Конфигурация контракта и работа со ссылками-приглашениями

**Файлы:**
- Создать: `site/src/lib/contract.ts`
- Создать: `site/src/lib/claimLink.ts`
- Тест: `site/src/lib/__tests__/claimLink.test.ts`

**Интерфейсы:**
- Результат: `CONTRACT_ADDRESS: string`, `CONTRACT_ABI: readonly string[]`, `NETWORK: { chainId: number; chainIdHex: string; chainName: string; rpcUrl: string; blockExplorerUrl: string; nativeCurrency: { name: string; symbol: string; decimals: number } }`, `BASE_PATH: string` — из `contract.ts`. `generateNonce(): bigint`, `buildClaimLink(baseUrl: string, params: ClaimLinkParams): string`, `parseClaimLink(searchParams: URLSearchParams): ClaimLinkParams | null`, тип `ClaimLinkParams = { to: string; amount: bigint; nonce: bigint; signature: string }` — из `claimLink.ts`. Используются во всех трёх страницах (задачи 6-8).

- [ ] **Шаг 1: Написать `contract.ts` (константы, без логики — тестировать нечего)**

Создать `site/src/lib/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0x44e8b28c3b059EeAb4C84d78bffe1808067997b5";

export const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function claimReward(address to, uint256 amount, uint256 nonce, bytes signature)",
  "function usedNonces(uint256 nonce) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event RewardClaimed(address indexed to, uint256 amount, uint256 nonce)",
] as const;

export const NETWORK = {
  chainId: 80002,
  chainIdHex: "0x13882",
  chainName: "Polygon Amoy Testnet",
  rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/alch__BseOViqmTEQINk_lYPHs",
  blockExplorerUrl: "https://amoy.polygonscan.com",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
};

export const BASE_PATH = "/AleCoin";
```

- [ ] **Шаг 2: Написать падающий тест для `claimLink.ts`**

Создать `site/src/lib/__tests__/claimLink.test.ts`:

```typescript
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
```

- [ ] **Шаг 3: Запустить тест и убедиться, что он падает**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: FAIL — модуль `../claimLink` не найден.

- [ ] **Шаг 4: Написать `claimLink.ts`**

Создать `site/src/lib/claimLink.ts`:

```typescript
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
```

- [ ] **Шаг 5: Запустить тест и убедиться, что он проходит**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: PASS — все 5 тестов зелёные.

- [ ] **Шаг 6: Коммит**

```bash
git add site/src/lib/contract.ts site/src/lib/claimLink.ts site/src/lib/__tests__/claimLink.test.ts
git commit -m "$(cat <<'EOF'
Add contract config and claim link helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: EIP-712 подпись награды

**Файлы:**
- Создать: `site/src/lib/signClaim.ts`
- Тест: `site/src/lib/__tests__/signClaim.test.ts`

**Интерфейсы:**
- Использует: `CONTRACT_ADDRESS` из `contract.ts` (задача 2).
- Результат: `CLAIM_TYPES` (константа с типом `Claim`), `getClaimDomain(chainId: number)`, `signClaim(signer: Signer, chainId: number, to: string, amount: bigint, nonce: bigint): Promise<string>`. Используется на странице `/admin` (задача 8).

- [ ] **Шаг 1: Написать падающий тест**

Создать `site/src/lib/__tests__/signClaim.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { Wallet, verifyTypedData } from "ethers";
import { signClaim, getClaimDomain, CLAIM_TYPES } from "../signClaim";

describe("signClaim", () => {
  it("produces a signature that recovers to the signer's address", async () => {
    const wallet = Wallet.createRandom();
    const chainId = 80002;
    const to = "0x000000000000000000000000000000000000f1";
    const amount = 50n * 10n ** 18n;
    const nonce = 12345n;

    const signature = await signClaim(wallet, chainId, to, amount, nonce);

    const recovered = verifyTypedData(
      getClaimDomain(chainId),
      CLAIM_TYPES,
      { to, amount, nonce },
      signature,
    );

    expect(recovered).toBe(wallet.address);
  });

  it("produces different signatures for different signers over the same data", async () => {
    const walletA = Wallet.createRandom();
    const walletB = Wallet.createRandom();
    const chainId = 80002;
    const to = "0x000000000000000000000000000000000000f1";
    const amount = 1n;
    const nonce = 1n;

    const sigA = await signClaim(walletA, chainId, to, amount, nonce);
    const sigB = await signClaim(walletB, chainId, to, amount, nonce);

    expect(sigA).not.toBe(sigB);
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: FAIL — модуль `../signClaim` не найден.

- [ ] **Шаг 3: Написать `signClaim.ts`**

Создать `site/src/lib/signClaim.ts`:

```typescript
import type { Signer } from "ethers";
import { CONTRACT_ADDRESS } from "./contract";

export const CLAIM_TYPES = {
  Claim: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export function getClaimDomain(chainId: number) {
  return {
    name: "AleCoin",
    version: "1",
    chainId,
    verifyingContract: CONTRACT_ADDRESS,
  };
}

export async function signClaim(
  signer: Signer,
  chainId: number,
  to: string,
  amount: bigint,
  nonce: bigint,
): Promise<string> {
  const domain = getClaimDomain(chainId);
  return signer.signTypedData(domain, CLAIM_TYPES, { to, amount, nonce });
}
```

Домен и тип здесь совпадают с `EIP712("AleCoin", "1")` и `CLAIM_TYPEHASH` в `contracts/AleCoin.sol` — если контракт когда-либо поменяется, эти два места нужно менять синхронно.

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: PASS — все тесты зелёные (2 новых + 5 из задачи 2).

- [ ] **Шаг 5: Коммит**

```bash
git add site/src/lib/signClaim.ts site/src/lib/__tests__/signClaim.test.ts
git commit -m "$(cat <<'EOF'
Add EIP-712 claim signing helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Перевод ошибок на русский

**Файлы:**
- Создать: `site/src/lib/errors.ts`
- Тест: `site/src/lib/__tests__/errors.test.ts`

**Интерфейсы:**
- Результат: `translateError(error: unknown): string`. Используется на всех трёх страницах (задачи 6-8) вокруг любого вызова кошелька/контракта.

- [ ] **Шаг 1: Написать падающий тест**

Создать `site/src/lib/__tests__/errors.test.ts`:

```typescript
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
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: FAIL — модуль `../errors` не найден.

- [ ] **Шаг 3: Написать `errors.ts`**

Создать `site/src/lib/errors.ts`:

```typescript
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
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

```bash
cd site && npx vitest run && cd ..
```

Ожидается: PASS — все тесты зелёные (4 новых + 7 из задач 2-3).

- [ ] **Шаг 5: Коммит**

```bash
git add site/src/lib/errors.ts site/src/lib/__tests__/errors.test.ts
git commit -m "$(cat <<'EOF'
Add Russian-language error message translation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Подключение кошелька и проверка сети

**Файлы:**
- Создать: `site/src/lib/wallet.ts`

Без автотеста — этот модуль обращается к `window.ethereum` (MetaMask), что не имеет смысла мокать в юнит-тесте без реального браузера; проверяется вручную в задаче 9 (как и договаривались в спеке: автотесты только для чистой логики — nonce, ссылки, EIP-712).

**Интерфейсы:**
- Использует: `NETWORK` из `contract.ts` (задача 2).
- Результат: `hasWallet(): boolean`, `connectWallet(): Promise<BrowserProvider>`, `ensureNetwork(provider: BrowserProvider): Promise<void>`. Используется на всех трёх страницах (задачи 6-8).

- [ ] **Шаг 1: Написать `wallet.ts`**

Создать `site/src/lib/wallet.ts`:

```typescript
import { BrowserProvider } from "ethers";
import { NETWORK } from "./contract";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function hasWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function connectWallet(): Promise<BrowserProvider> {
  if (!hasWallet()) {
    throw new Error("MetaMask не установлен");
  }
  const provider = new BrowserProvider(window.ethereum!);
  await provider.send("eth_requestAccounts", []);
  await ensureNetwork(provider);
  return provider;
}

export async function ensureNetwork(provider: BrowserProvider): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) === NETWORK.chainId) {
    return;
  }

  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: NETWORK.chainIdHex },
    ]);
  } catch (error) {
    const switchError = error as { code?: number };
    if (switchError.code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: NETWORK.chainIdHex,
          chainName: NETWORK.chainName,
          rpcUrls: [NETWORK.rpcUrl],
          blockExplorerUrls: [NETWORK.blockExplorerUrl],
          nativeCurrency: NETWORK.nativeCurrency,
        },
      ]);
    } else {
      throw error;
    }
  }
}
```

- [ ] **Шаг 2: Проверить, что проект всё ещё собирается**

```bash
cd site && npm run build && cd ..
```

Ожидается: сборка проходит без ошибок типов (пока этот модуль нигде не используется, но должен компилироваться сам по себе).

- [ ] **Шаг 3: Коммит**

```bash
git add site/src/lib/wallet.ts
git commit -m "$(cat <<'EOF'
Add wallet connection and network-check helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Главная страница

**Файлы:**
- Модифицировать: `site/src/app/page.tsx` (заменить сгенерированное содержимое)
- Модифицировать: `site/src/app/layout.tsx` (заменить сгенерированное содержимое)

**Интерфейсы:**
- Использует: `CONTRACT_ADDRESS`, `CONTRACT_ABI` (задача 2); `connectWallet` (задача 5); `translateError` (задача 4).
- Результат: рабочая страница `/` с подключением кошелька, балансом, переводом токенов и историей операций пользователя.

- [ ] **Шаг 1: Переписать layout**

Заменить `site/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AleCoin",
  description: "AleCoin (ALE) — токен на Polygon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Шаг 2: Переписать главную страницу**

Заменить `site/src/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { BrowserProvider, Contract, EventLog, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";

type HistoryEntry = {
  type: "sent" | "received" | "reward";
  amount: string;
  counterparty: string;
  txHash: string;
  blockNumber: number;
};

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleConnect() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  async function loadAccountData(provider: BrowserProvider, address: string) {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const rawBalance = await contract.balanceOf(address);
    setBalance(formatEther(rawBalance));

    const sent = await contract.queryFilter(contract.filters.Transfer(address, null));
    const received = await contract.queryFilter(contract.filters.Transfer(null, address));
    const rewards = await contract.queryFilter(contract.filters.RewardClaimed(address));

    const entries: HistoryEntry[] = [
      ...sent.map((event) => toTransferEntry(event as EventLog, "sent")),
      ...received.map((event) => toTransferEntry(event as EventLog, "received")),
      ...rewards.map((event) => toRewardEntry(event as EventLog)),
    ];

    entries.sort((a, b) => b.blockNumber - a.blockNumber);
    setHistory(entries);
  }

  function toTransferEntry(event: EventLog, type: "sent" | "received"): HistoryEntry {
    const [from, to, value] = event.args as unknown as [string, string, bigint];
    return {
      type,
      amount: formatEther(value),
      counterparty: type === "sent" ? to : from,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  function toRewardEntry(event: EventLog): HistoryEntry {
    const [, amount] = event.args as unknown as [string, bigint, bigint];
    return {
      type: "reward",
      amount: formatEther(amount),
      counterparty: CONTRACT_ADDRESS,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  async function handleTransfer() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(transferTo, parseEther(transferAmount));
      await tx.wait();
      setStatus("Перевод выполнен.");
      const address = await signer.getAddress();
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <main>
      <h1>AleCoin</h1>

      {!account && (
        <>
          <button onClick={handleConnect}>Подключить кошелёк</button>
          <p>
            Получили ссылку на награду? Она открывается на отдельной странице.
            Если ссылки нет — напишите владельцу в Telegram.
          </p>
        </>
      )}

      {account && (
        <>
          <p>Адрес: {account}</p>
          <p>Баланс: {balance ?? "…"} ALE</p>

          <h2>Перевести токены</h2>
          <input
            placeholder="Адрес получателя"
            value={transferTo}
            onChange={(event) => setTransferTo(event.target.value)}
          />
          <input
            placeholder="Сумма ALE"
            value={transferAmount}
            onChange={(event) => setTransferAmount(event.target.value)}
          />
          <button onClick={handleTransfer}>Отправить</button>

          <h2>История</h2>
          <ul>
            {history.map((entry) => (
              <li key={entry.txHash + entry.type}>
                {entry.type === "sent" &&
                  `Отправлено ${entry.amount} ALE → ${entry.counterparty}`}
                {entry.type === "received" &&
                  `Получено ${entry.amount} ALE от ${entry.counterparty}`}
                {entry.type === "reward" && `Получена награда ${entry.amount} ALE`}
              </li>
            ))}
          </ul>
        </>
      )}

      {status && <p>{status}</p>}
    </main>
  );
}
```

- [ ] **Шаг 3: Проверить сборку**

```bash
cd site && npm run build && cd ..
```

Ожидается: сборка проходит без ошибок типов, `site/out/index.html` содержит обновлённую страницу.

- [ ] **Шаг 4: Коммит**

```bash
git add site/src/app/page.tsx site/src/app/layout.tsx
git commit -m "$(cat <<'EOF'
Build home page: wallet connect, balance, transfer, own history

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Страница получения награды (`/claim`)

**Файлы:**
- Создать: `site/src/app/claim/page.tsx`
- Создать: `site/src/app/claim/claim-view.tsx`

**Интерфейсы:**
- Использует: `parseClaimLink` (задача 2); `CONTRACT_ADDRESS`, `CONTRACT_ABI` (задача 2); `connectWallet` (задача 5); `translateError` (задача 4).
- Результат: страница `/claim`, разбирающая параметры ссылки и вызывающая `claimReward`.

- [ ] **Шаг 1: Написать обёртку страницы с Suspense**

Создать `site/src/app/claim/page.tsx`:

```tsx
import { Suspense } from "react";
import { ClaimView } from "./claim-view";

export default function ClaimPage() {
  return (
    <Suspense fallback={<p>Загрузка…</p>}>
      <ClaimView />
    </Suspense>
  );
}
```

`useSearchParams` в Next.js обязательно оборачивается в `Suspense` при статическом экспорте — иначе сборка выдаст предупреждение/ошибку о CSR bailout.

- [ ] **Шаг 2: Написать саму логику страницы**

Создать `site/src/app/claim/claim-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Contract, formatEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { parseClaimLink } from "@/lib/claimLink";

export function ClaimView() {
  const searchParams = useSearchParams();
  const claim = parseClaimLink(searchParams);
  const [status, setStatus] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  if (!claim) {
    return <p>Ссылка повреждена.</p>;
  }

  async function handleClaim() {
    setStatus(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimReward(
        claim.to,
        claim.amount,
        claim.nonce,
        claim.signature,
      );
      await tx.wait();
      setClaimed(true);
      setStatus("Токены получены!");
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <main>
      <h1>AleCoin — получить награду</h1>
      <p>
        Вам полагается {formatEther(claim.amount)} ALE на адрес {claim.to}.
      </p>
      {!claimed && <button onClick={handleClaim}>Получить</button>}
      {status && <p>{status}</p>}
    </main>
  );
}
```

- [ ] **Шаг 3: Проверить сборку**

```bash
cd site && npm run build && cd ..
```

Ожидается: сборка проходит без ошибок и без предупреждений про `useSearchParams`/Suspense.

- [ ] **Шаг 4: Коммит**

```bash
git add site/src/app/claim
git commit -m "$(cat <<'EOF'
Build claim page: parse link, call claimReward

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Админ-страница (`/admin`)

**Файлы:**
- Создать: `site/src/app/admin/page.tsx`
- Создать: `site/src/app/admin/admin-form.tsx`
- Создать: `site/public/robots.txt`

**Интерфейсы:**
- Использует: `connectWallet` (задача 5); `translateError` (задача 4); `generateNonce`, `buildClaimLink` (задача 2); `signClaim` (задача 3); `BASE_PATH` (задача 2).
- Результат: скрытая страница `/admin` с формой создания награды и готовой ссылкой для копирования.

- [ ] **Шаг 1: Написать страницу с `noindex`**

Создать `site/src/app/admin/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AdminForm } from "./admin-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main>
      <h1>AleCoin — выдача наград</h1>
      <AdminForm />
    </main>
  );
}
```

- [ ] **Шаг 2: Написать форму**

Создать `site/src/app/admin/admin-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { parseEther } from "ethers";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { generateNonce, buildClaimLink } from "@/lib/claimLink";
import { signClaim } from "@/lib/signClaim";
import { BASE_PATH } from "@/lib/contract";

export function AdminForm() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreate() {
    setStatus(null);
    setLink(null);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      const amountWei = parseEther(amount);
      const nonce = generateNonce();

      const signature = await signClaim(
        signer,
        Number(network.chainId),
        to,
        amountWei,
        nonce,
      );

      const claimLink = buildClaimLink(window.location.origin + BASE_PATH, {
        to,
        amount: amountWei,
        nonce,
        signature,
      });

      setLink(claimLink);
      setStatus("Ссылка готова.");
    } catch (error) {
      setStatus(translateError(error));
    }
  }

  return (
    <>
      <input
        placeholder="Адрес друга"
        value={to}
        onChange={(event) => setTo(event.target.value)}
      />
      <input
        placeholder="Сумма ALE"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <button onClick={handleCreate}>Создать награду</button>

      {link && (
        <p>
          <input readOnly value={link} onFocus={(event) => event.target.select()} />
        </p>
      )}
      {status && <p>{status}</p>}
    </>
  );
}
```

- [ ] **Шаг 3: Запретить индексацию в robots.txt**

Создать `site/public/robots.txt`:

```
User-agent: *
Disallow: /AleCoin/admin
```

Путь указан с учётом `basePath: "/AleCoin"` — после сборки сайт живёт в `https://0xm1dn1ght.github.io/AleCoin/`, поэтому реальный путь до админки — `/AleCoin/admin`. Метатег `noindex` на самой странице (шаг 1) — более надёжный сигнал, `robots.txt` — дополнительная подстраховка.

- [ ] **Шаг 4: Проверить сборку**

```bash
cd site && npm run build && cd ..
```

Ожидается: сборка проходит без ошибок, `site/out/admin/index.html` содержит мета-тег `noindex`.

- [ ] **Шаг 5: Коммит**

```bash
git add site/src/app/admin site/public/robots.txt
git commit -m "$(cat <<'EOF'
Build hidden admin page: generate signed reward links

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Включить GitHub Pages и пройти сценарий вживую

**Файлы:** нет — организационная задача, без изменений кода.

**Интерфейсы:** нет.

- [ ] **Шаг 1: Включить сборку через GitHub Actions в настройках репозитория**

```bash
gh api -X PUT repos/0xm1dn1ght/AleCoin/pages -f build_type=workflow
```

Если репозиторий Pages ещё не создан, эта команда может вернуть ошибку — тогда создать через:

```bash
gh api -X POST repos/0xm1dn1ght/AleCoin/pages -f build_type=workflow
```

- [ ] **Шаг 2: Запушить и дождаться деплоя**

```bash
git push
gh run watch
```

Ожидается: workflow `Deploy site to GitHub Pages` завершается успешно (зелёная галочка).

- [ ] **Шаг 3: Проверить, что сайт открывается**

Открыть `https://0xm1dn1ght.github.io/AleCoin/` — должна открыться главная страница с кнопкой «Подключить кошелёк».

- [ ] **Шаг 4: Ручной прогон полного сценария (выполняется владельцем проекта)**

1. Открыть `https://0xm1dn1ght.github.io/AleCoin/admin`, подключить кошелёк-владелец.
2. Создать награду на любой тестовый адрес (например, второй свой кошелёк), скопировать ссылку.
3. Открыть эту ссылку в другом браузере/устройстве (или с другого аккаунта MetaMask), подключить кошелёк получателя, нажать «Получить».
4. Убедиться, что баланс получателя увеличился, а на главной странице обоих кошельков видна корректная история.
5. Повторно открыть ту же ссылку — должно появиться сообщение «эта награда уже была получена», а не техническая ошибка.

Это последний шаг перед тем, как AleCoin будет готов к переезду на Polygon mainnet.
