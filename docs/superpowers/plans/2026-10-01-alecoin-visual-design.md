# План реализации: визуальный дизайн сайта AleCoin

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: используйте superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для выполнения плана по задачам. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Оформить уже работающий сайт AleCoin (`site/`) в стиле «Тёмный паб»: тема на Tailwind CSS v4, свои шрифты, значок с клевером, новая раскладка всех страниц и несколько небольших улучшений удобства (состояние «занято», ссылки на PolygonScan, кнопка «Скопировать», формат сумм).

**Архитектура:** Цвета и шрифты задаются один раз как токены темы Tailwind в `site/src/app/globals.css`. Повторяющиеся элементы интерфейса — маленькие компоненты в `site/src/components/` (шапка, значок, карточка, кнопка, поле ввода, плашка). Чистые вспомогательные функции (формат суммы, сокращение адреса, ссылка на транзакцию, проверка «окончательной» ошибки) — в `site/src/lib/` с тестами Vitest. Страницы (`/`, `/claim`, `/admin`, 404) собираются из этих частей; логика работы с контрактом не меняется.

**Тех. стек:** Next.js 16 (App Router, статический экспорт), React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), Fontsource (`@fontsource/inter`, `@fontsource/playfair-display`), ethers.js v6, Vitest.

**Спецификация:** `docs/superpowers/specs/2026-10-01-alecoin-visual-design.md` (исполнителю — прочитать целиком перед началом).

## Общие ограничения

- Палитра (токены темы): `pub` `#12291f` (фон), `amber` `#e0a83a` (акцент), `cream` `#f3e9d2` (текст); карточка — `cream` ~6% прозрачности, рамка — `cream` ~12%, приглушённый текст — `cream` ~70%, янтарная подложка значков — `amber` ~18%.
- Шрифты: **Playfair Display** (600, 800) — логотип, заголовки, крупные суммы; **Inter** (400, 600) — остальной текст; адреса/хеши — системный моноширинный. Подключаются только через npm-пакеты Fontsource — никаких запросов к Google Fonts ни при сборке, ни на сайте.
- Только тёмная тема, без переключателя.
- Tailwind CSS **v4**, через PostCSS-плагин `@tailwindcss/postcss`.
- Весь текст интерфейса — на простом русском языке; предыстория названия токена (друзья, пиво) нигде не упоминается.
- Логика контракта не меняется: `src/lib/contract.ts`, `src/lib/wallet.ts`, `src/lib/signClaim.ts`, `src/lib/claimLink.ts` **не трогать**; в `src/lib/errors.ts` только **добавить** новую функцию, существующие не менять.
- Существующие тесты (`claimLink`, `errors`, `signClaim`) проходят без изменений.
- Кнопки и поля — высота не меньше 44 px (`min-h-11`); шрифт полей ввода — не меньше 16 px (`text-base`), иначе iPhone увеличивает страницу при фокусе.
- Внутренние ссылки — только через `next/link` (`<Link href="/">`), чтобы работал `basePath: "/AleCoin"` на GitHub Pages. Внешние ссылки (PolygonScan) — `<a target="_blank" rel="noopener noreferrer">`.
- Финальная проверка каждой задачи, меняющей код, — `npm run build` в `site/` (Vitest не проверяет типы так, как сборка Next).
- Коммиты — от `0xm1dn1ght` / `129661120+0xm1dn1ght@users.noreply.github.com` (уже настроено в локальном git-конфиге репозитория). Пуш в `master` запускает деплой — пушить только с согласия владельца проекта (Задача 7).
- Без комментариев в коде, кроме случаев, где причина (WHY) действительно не очевидна.
- Все команды `npm` выполняются из папки `site/` (`D:\rxr\MyProject\AleCoin\site`).

## Review Focus

Случаи, которые спека подразумевает, но которые легко сломать незаметно. Для чистой логики — тесты в задачах; для UI (в проекте нет инфраструктуры компонентных тестов, добавлять её вне рамок) — обязательные ручные проверки в указанных задачах.

1. **Узкий экран (~375 px) с длинными адресами и ссылкой-наградой** — страница не должна прокручиваться вбок: адреса сокращаются (`shortenAddress`, тесты в Задаче 2), ссылка в админке переносится (`break-all`), строки истории обрезаются (`truncate`). Ручная проверка — Задача 7.
2. **Повторное нажатие кнопки, пока транзакция в процессе** — кнопка заблокирована и показывает этап. Ручная проверка — Задачи 4, 5, 6 (без MetaMask кнопка коротко блокируется и возвращается с плашкой ошибки) и Задача 7 (с MetaMask на телефоне).
3. **Повторная/поддельная ссылка vs. отмена и сбой сети на `/claim`** — после «уже получена» и «недействительна» кнопка скрывается, после отмены или сбоя сети — остаётся. Тесты `isFinalClaimError` — Задача 2.
4. **Буфер обмена недоступен** (встроенный браузер MetaMask может не дать доступ) — кнопка честно пишет, что не получилось, ссылку можно выделить вручную. Ручная проверка — Задача 6 и Задача 7.
5. **Необычные суммы**: 0, 1 wei, дробные, миллионы — формат без «.0», с неразрывными пробелами между разрядами. Тесты `formatAle` — Задача 2.

---

## Структура файлов

```
site/
  package.json                  # + tailwindcss, @tailwindcss/postcss, postcss, @fontsource/*
  postcss.config.mjs            # СОЗДАТЬ: подключение Tailwind
  src/
    app/
      globals.css               # ПЕРЕПИСАТЬ: Tailwind + токены темы + базовые стили
      layout.tsx                # ИЗМЕНИТЬ: импорт шрифтов, классы body
      icon.svg                  # СОЗДАТЬ: иконка вкладки (монета с клевером)
      favicon.ico               # УДАЛИТЬ (заменён icon.svg)
      not-found.tsx             # СОЗДАТЬ: оформленная 404
      page.tsx                  # ПЕРЕПИСАТЬ разметку: главная
      intro.tsx                 # СОЗДАТЬ: вступление на главной (кошелёк не подключён)
      history-list.tsx          # СОЗДАТЬ: список операций
      claim/
        page.tsx                # ИЗМЕНИТЬ: оформить fallback «Загрузка…»
        claim-view.tsx          # ПЕРЕПИСАТЬ разметку: страница награды
      admin/
        page.tsx                # ИЗМЕНИТЬ: шапка и карточка переезжают в admin-form
        admin-form.tsx          # ПЕРЕПИСАТЬ разметку: форма + «Скопировать»
    components/                 # СОЗДАТЬ папку
      CoinLogo.tsx              # значок: монета с клевером (SVG)
      SiteHeader.tsx            # шапка: значок + название + адрес/кнопка
      Panel.tsx                 # карточка + Eyebrow (метка раздела)
      Button.tsx                # кнопка (primary/secondary, состояние «занято») + тексты этапов
      TextField.tsx             # поле ввода с подписью
      Notice.tsx                # плашка-сообщение
    lib/
      format.ts                 # СОЗДАТЬ: shortenAddress, formatAle, txUrl
      errors.ts                 # ДОБАВИТЬ: isFinalClaimError
      __tests__/
        format.test.ts          # СОЗДАТЬ
        errors.test.ts          # ДОБАВИТЬ тесты isFinalClaimError
```

---

### Task 1: Tailwind CSS, theme tokens, fonts and icon

**Файлы:**
- Изменить: `site/package.json`, `site/package-lock.json` (через `npm install`)
- Создать: `site/postcss.config.mjs`
- Переписать: `site/src/app/globals.css`
- Изменить: `site/src/app/layout.tsx`
- Создать: `site/src/app/icon.svg`
- Удалить: `site/src/app/favicon.ico`

**Интерфейсы:**
- Потребляет: ничего.
- Производит (используют все следующие задачи): классы Tailwind из токенов темы — цвета `pub`, `amber`, `cream`, `card`, `line`, `muted`, `glow` (например `bg-pub`, `text-amber`, `border-line`, `bg-card`, `text-muted`, `bg-glow`); шрифты `font-sans` (Inter, по умолчанию для всего текста) и `font-display` (Playfair Display). `body` — flex-колонка на всю высоту экрана (`flex min-h-dvh flex-col`), поэтому страницы могут растягивать `main` через `flex-1`.

- [ ] **Шаг 1: Установить пакеты**

Из `site/`:

```bash
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4 postcss
npm install @fontsource/inter@^5 @fontsource/playfair-display@^5
```

Ожидается: пакеты появились в `package.json` (`tailwindcss`, `@tailwindcss/postcss`, `postcss` — в `devDependencies`; оба `@fontsource/*` — в `dependencies`), ошибок установки нет. Предупреждения `npm warn allow-scripts` можно игнорировать.

- [ ] **Шаг 2: Создать `site/postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Шаг 3: Переписать `site/src/app/globals.css` целиком**

```css
@import "tailwindcss";

@theme {
  --color-pub: #12291f;
  --color-amber: #e0a83a;
  --color-cream: #f3e9d2;
  --color-card: rgb(243 233 210 / 0.06);
  --color-line: rgb(243 233 210 / 0.12);
  --color-muted: rgb(243 233 210 / 0.7);
  --color-glow: rgb(224 168 58 / 0.18);

  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Playfair Display", Georgia, serif;
}

html {
  color-scheme: dark;
}

@layer base {
  body {
    @apply bg-pub text-cream font-sans antialiased;
  }
}
```

- [ ] **Шаг 4: Обновить `site/src/app/layout.tsx` целиком**

```tsx
import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/800.css";
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
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Шаг 5: Создать `site/src/app/icon.svg` и удалить `favicon.ico`**

`site/src/app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="13" fill="#e0a83a"/>
  <g fill="#12291f">
    <circle cx="14" cy="9.5" r="3.6"/>
    <circle cx="9.8" cy="15" r="3.6"/>
    <circle cx="18.2" cy="15" r="3.6"/>
  </g>
  <path d="M14 14 Q15 19 17.5 22" stroke="#12291f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>
```

Удалить стандартную иконку:

```bash
git rm src/app/favicon.ico
```

- [ ] **Шаг 6: Собрать и проверить**

```bash
npm test
npm run build
```

Ожидается: 13 тестов проходят; сборка успешна, маршруты `/`, `/_not-found`, `/admin`, `/claim`, `/icon.svg`.

Проверить, что стили Tailwind и шрифты попали в сборку и иконка подключена с учётом `basePath`:

```bash
grep -o 'href="/AleCoin/icon.svg[^"]*"' out/index.html
grep -rl --include="*.css" "Playfair Display" out/_next/static
grep -rl --include="*.css" -- "--color-pub" out/_next/static
```

Ожидается: первая команда находит `href="/AleCoin/icon.svg..."` (если путь без `/AleCoin` — иконка не загрузится на GitHub Pages, это нужно исправить до коммита); вторая и третья — хотя бы по одному CSS-файлу.

Проверить, что в сборке нет обращений к Google Fonts:

```bash
grep -rl "fonts.googleapis" out || echo "OK: no Google Fonts"
```

Ожидается: `OK: no Google Fonts`.

- [ ] **Шаг 7: Коммит**

```bash
git add package.json package-lock.json postcss.config.mjs src/app/globals.css src/app/layout.tsx src/app/icon.svg
git commit -m "Add Tailwind CSS v4 theme, self-hosted fonts and shamrock icon"
```

(`favicon.ico` уже помечен на удаление через `git rm` и войдёт в этот же коммит.)

---

### Task 2: Formatting helpers and final-claim-error check

**Файлы:**
- Создать: `site/src/lib/format.ts`
- Создать: `site/src/lib/__tests__/format.test.ts`
- Изменить: `site/src/lib/errors.ts` (только добавить в конец файла)
- Изменить: `site/src/lib/__tests__/errors.test.ts` (только добавить блок `describe`)

**Интерфейсы:**
- Потребляет: `NETWORK.blockExplorerUrl` из `@/lib/contract` (значение `"https://amoy.polygonscan.com"`); `formatEther` из `ethers`; внутреннюю функцию `extractErrorInfo` в `errors.ts`.
- Производит:
  - `shortenAddress(address: string): string` — `"0x58EE5eaB…fad70b"` → `"0x58EE…d70b"`; строки длиной ≤ 12 символов возвращаются без изменений.
  - `formatAle(wei: bigint): string` — сумма в ALE без лишних нулей, разряды целой части разделены неразрывным пробелом `\u00a0`, дробная часть через точку: `1250 ALE` → `"1 250"`, `0.5 ALE` → `"0.5"`.
  - `txUrl(txHash: string): string` — `"https://amoy.polygonscan.com/tx/<hash>"`.
  - `isFinalClaimError(error: unknown): boolean` — `true` только для отказов контракта `"AleCoin: nonce already used"` и `"AleCoin: invalid signature"` (в любом поле ошибки, которое уже читает `translateError`).

- [ ] **Шаг 1: Написать падающие тесты для `format.ts`**

`site/src/lib/__tests__/format.test.ts`:

```ts
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
```

- [ ] **Шаг 2: Убедиться, что тесты падают**

```bash
npx vitest run src/lib/__tests__/format.test.ts
```

Ожидается: FAIL — модуль `../format` не найден.

- [ ] **Шаг 3: Реализовать `site/src/lib/format.ts`**

```ts
import { formatEther } from "ethers";
import { NETWORK } from "./contract";

export function shortenAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAle(wei: bigint): string {
  const [whole, fraction] = formatEther(wei).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${grouped}.${trimmedFraction}` : grouped;
}

export function txUrl(txHash: string): string {
  return `${NETWORK.blockExplorerUrl}/tx/${txHash}`;
}
```

- [ ] **Шаг 4: Убедиться, что тесты проходят**

```bash
npx vitest run src/lib/__tests__/format.test.ts
```

Ожидается: 9 тестов PASS.

- [ ] **Шаг 5: Написать падающие тесты для `isFinalClaimError`**

В `site/src/lib/__tests__/errors.test.ts` заменить первую строку импорта:

```ts
import { translateError, isFinalClaimError } from "../errors";
```

и добавить в конец файла:

```ts
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
```

- [ ] **Шаг 6: Убедиться, что новые тесты падают**

```bash
npx vitest run src/lib/__tests__/errors.test.ts
```

Ожидается: FAIL — `isFinalClaimError` не экспортируется (старые 6 тестов при этом не ломаются).

- [ ] **Шаг 7: Реализовать `isFinalClaimError`**

Добавить в `site/src/lib/errors.ts` сразу после функции `translateError` (существующий код не менять):

```ts
const FINAL_CLAIM_REASONS = ["AleCoin: nonce already used", "AleCoin: invalid signature"];

export function isFinalClaimError(error: unknown): boolean {
  const { text } = extractErrorInfo(error);
  return FINAL_CLAIM_REASONS.some((reason) => text.includes(reason));
}
```

- [ ] **Шаг 8: Прогнать все тесты и сборку**

```bash
npm test
npm run build
```

Ожидается: 27 тестов PASS (13 старых + 9 `format` + 5 `isFinalClaimError`); сборка успешна.

- [ ] **Шаг 9: Коммит**

```bash
git add src/lib/format.ts src/lib/__tests__/format.test.ts src/lib/errors.ts src/lib/__tests__/errors.test.ts
git commit -m "Add amount/address formatting helpers and final claim error check"
```

---

### Task 3: Shared UI components

**Файлы:**
- Создать: `site/src/components/CoinLogo.tsx`
- Создать: `site/src/components/Button.tsx`
- Создать: `site/src/components/Panel.tsx`
- Создать: `site/src/components/TextField.tsx`
- Создать: `site/src/components/Notice.tsx`
- Создать: `site/src/components/SiteHeader.tsx`

**Интерфейсы:**
- Потребляет: токены темы из Задачи 1; `shortenAddress` из `@/lib/format` (Задача 2).
- Производит (используют Задачи 4–7):
  - `CoinLogo({ size?: number })` — SVG-значок, по умолчанию 28 px.
  - `Button(props)` — все атрибуты `<button>` плюс `variant?: "primary" | "secondary"` (по умолчанию `"primary"`) и `busy?: string | null`. Если `busy` — строка, кнопка заблокирована и показывает эту строку вместо `children`. По умолчанию `type="button"`.
  - Константы `BUSY_WALLET = "Подтвердите в MetaMask…"` и `BUSY_NETWORK = "Ждём сеть…"` (экспорт из `Button.tsx`).
  - `Panel({ title?: string; className?: string; children })` — карточка; если `title` задан — метка раздела (`<h2>`) сверху.
  - `Eyebrow({ children })` — метка раздела отдельно от карточки (`<p>`), экспорт из `Panel.tsx`.
  - `TextField(props)` — все атрибуты `<input>` плюс обязательный `label: string`.
  - `Notice({ children })` — плашка-сообщение.
  - `SiteHeader({ account?: string | null; onConnect?: () => void; connectBusy?: string | null })` — шапка; справа сокращённый адрес, если `account` задан, иначе кнопка «Подключить кошелёк», если передан `onConnect`, иначе ничего.

- [ ] **Шаг 1: `site/src/components/CoinLogo.tsx`**

```tsx
export function CoinLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="#e0a83a" />
      <g fill="#12291f">
        <circle cx="14" cy="9.5" r="3.6" />
        <circle cx="9.8" cy="15" r="3.6" />
        <circle cx="18.2" cy="15" r="3.6" />
      </g>
      <path
        d="M14 14 Q15 19 17.5 22"
        stroke="#12291f"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Шаг 2: `site/src/components/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

export const BUSY_WALLET = "Подтвердите в MetaMask…";
export const BUSY_NETWORK = "Ждём сеть…";

const VARIANTS = {
  primary: "bg-amber text-pub hover:brightness-110",
  secondary: "border border-amber text-amber hover:bg-glow",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  busy?: string | null;
};

export function Button({
  variant = "primary",
  busy = null,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy !== null}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {busy ?? children}
    </button>
  );
}
```

- [ ] **Шаг 3: `site/src/components/Panel.tsx`**

```tsx
import type { ReactNode } from "react";

const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.14em] text-amber";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={LABEL_CLASS}>{children}</p>;
}

export function Panel({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-line bg-card p-5 ${className}`}>
      {title && <h2 className={`mb-3 ${LABEL_CLASS}`}>{title}</h2>}
      {children}
    </section>
  );
}
```

- [ ] **Шаг 4: `site/src/components/TextField.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, className = "", ...rest }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <input
        {...rest}
        className={`min-h-11 w-full rounded-lg border border-line bg-transparent px-3 text-base text-cream placeholder:text-cream/40 focus:border-amber focus:outline-none ${className}`}
      />
    </label>
  );
}
```

- [ ] **Шаг 5: `site/src/components/Notice.tsx`**

```tsx
import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-amber/50 bg-glow px-4 py-3 text-center text-sm"
    >
      {children}
    </p>
  );
}
```

- [ ] **Шаг 6: `site/src/components/SiteHeader.tsx`**

```tsx
import Link from "next/link";
import { CoinLogo } from "./CoinLogo";
import { Button } from "./Button";
import { shortenAddress } from "@/lib/format";

type SiteHeaderProps = {
  account?: string | null;
  onConnect?: () => void;
  connectBusy?: string | null;
};

export function SiteHeader({ account, onConnect, connectBusy = null }: SiteHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <CoinLogo />
          <span className="font-display text-xl font-extrabold text-amber">AleCoin</span>
        </Link>
        {account ? (
          <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-amber" aria-hidden="true" />
            {shortenAddress(account)}
          </span>
        ) : (
          onConnect && (
            <div className="hidden sm:block">
              <Button variant="secondary" onClick={onConnect} busy={connectBusy} className="text-sm">
                Подключить кошелёк
              </Button>
            </div>
          )
        )}
      </div>
    </header>
  );
}
```

(На телефоне кнопка в шапке скрыта — там уже есть большая кнопка во вступлении, а узкая шапка не вмещает обе надписи.)

- [ ] **Шаг 7: Проверить типы и линтер**

```bash
npm run lint
npm run build
```

Ожидается: линтер без ошибок; сборка успешна (компоненты ещё нигде не используются — это нормально, сборка проверяет их типы).

- [ ] **Шаг 8: Коммит**

```bash
git add src/components
git commit -m "Add shared UI components: header, logo, panel, button, text field, notice"
```

---

### Task 4: Home page

**Файлы:**
- Переписать: `site/src/app/page.tsx`
- Создать: `site/src/app/intro.tsx`
- Создать: `site/src/app/history-list.tsx`

**Интерфейсы:**
- Потребляет: `SiteHeader`, `Panel`, `Eyebrow`, `Button`, `BUSY_WALLET`, `BUSY_NETWORK`, `TextField`, `Notice` (Задача 3); `formatAle`, `shortenAddress`, `txUrl` (Задача 2); без изменений — `connectWallet` (`@/lib/wallet`), `translateError` (`@/lib/errors`), `CONTRACT_ADDRESS`, `CONTRACT_ABI` (`@/lib/contract`).
- Производит: `Intro({ onConnect: () => void; connectBusy: string | null })`; `HistoryList({ entries: HistoryEntry[] })`; тип `HistoryEntry` (экспорт из `history-list.tsx`):
  `{ type: "sent" | "received" | "reward"; amount: string; counterparty: string; txHash: string; blockNumber: number }`, где `amount` — уже отформатированная `formatAle` строка.

- [ ] **Шаг 1: `site/src/app/intro.tsx`**

```tsx
import { Button } from "@/components/Button";
import { Panel, Eyebrow } from "@/components/Panel";

const STEPS = [
  "Владелец создаёт награду и подписывает её в MetaMask",
  "Получатель получает одноразовую ссылку",
  "Открывает её, подключает кошелёк и забирает ALE",
];

type IntroProps = {
  onConnect: () => void;
  connectBusy: string | null;
};

export function Intro({ onConnect, connectBusy }: IntroProps) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
      <div>
        <Eyebrow>Токен ALE · Polygon</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Награды, которые выдаются вручную
        </h1>
        <p className="mt-4 max-w-prose text-muted">
          Владелец подписывает награду в своём кошельке, а получатель забирает токены по
          одноразовой ссылке. Без сервера и базы данных — всё проверяет смарт-контракт.
        </p>
        <Button onClick={onConnect} busy={connectBusy} className="mt-6">
          Подключить кошелёк
        </Button>
      </div>
      <Panel title="Как это работает">
        <ol className="grid gap-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-glow text-sm font-semibold text-amber">
                {index + 1}
              </span>
              <span className="text-muted">{step}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <p className="text-sm text-muted md:col-span-2">
        Получили ссылку на награду? Просто откройте её. Ссылки нет — напишите владельцу в
        Telegram.
      </p>
    </div>
  );
}
```

- [ ] **Шаг 2: `site/src/app/history-list.tsx`**

```tsx
import { shortenAddress, txUrl } from "@/lib/format";

export type HistoryEntry = {
  type: "sent" | "received" | "reward";
  amount: string;
  counterparty: string;
  txHash: string;
  blockNumber: number;
};

const ICONS: Record<HistoryEntry["type"], string> = {
  reward: "★",
  sent: "↑",
  received: "↓",
};

function describeEntry(entry: HistoryEntry): string {
  if (entry.type === "reward") {
    return "Награда";
  }
  if (entry.type === "sent") {
    return `Отправлено ${shortenAddress(entry.counterparty)}`;
  }
  return `Получено от ${shortenAddress(entry.counterparty)}`;
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted">Операций пока нет.</p>;
  }

  return (
    <>
      <ul>
        {entries.map((entry) => (
          <li key={entry.txHash + entry.type} className="border-t border-line first:border-t-0">
            <a
              href={txUrl(entry.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-between gap-3 py-2.5 hover:text-amber"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm ${
                    entry.type === "reward" ? "bg-glow text-amber" : "bg-card"
                  }`}
                >
                  {ICONS[entry.type]}
                </span>
                <span className="truncate">{describeEntry(entry)}</span>
              </span>
              <span
                className={`flex-none font-semibold ${entry.type === "sent" ? "" : "text-amber"}`}
              >
                {entry.type === "sent" ? "−" : "+"} {entry.amount} ALE
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Нажмите на операцию, чтобы открыть её в PolygonScan.</p>
    </>
  );
}
```

- [ ] **Шаг 3: Переписать `site/src/app/page.tsx` целиком**

Логика загрузки данных (`loadAccountData`, `toTransferEntry`, `toRewardEntry`) та же, что сейчас; меняются только формат суммы (`formatAle` вместо `formatEther`), состояния «занято» и разметка.

```tsx
"use client";

import { useState } from "react";
import { BrowserProvider, Contract, EventLog, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { formatAle } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";
import { Button, BUSY_WALLET, BUSY_NETWORK } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Notice } from "@/components/Notice";
import { Intro } from "./intro";
import { HistoryList, type HistoryEntry } from "./history-list";

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState<string | null>(null);
  const [transferBusy, setTransferBusy] = useState<string | null>(null);

  async function handleConnect() {
    setStatus(null);
    setConnectBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    } finally {
      setConnectBusy(null);
    }
  }

  async function loadAccountData(provider: BrowserProvider, address: string) {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const rawBalance = await contract.balanceOf(address);
    setBalance(formatAle(rawBalance));

    const sent = await contract.queryFilter(contract.filters.Transfer(address, null));
    const received = await contract.queryFilter(contract.filters.Transfer(null, address));
    const rewards = await contract.queryFilter(contract.filters.RewardClaimed(address));

    const rewardTxHashes = new Set(rewards.map((event) => event.transactionHash));
    const receivedWithoutRewards = received.filter(
      (event) => !rewardTxHashes.has(event.transactionHash),
    );

    const entries: HistoryEntry[] = [
      ...sent.map((event) => toTransferEntry(event as EventLog, "sent")),
      ...receivedWithoutRewards.map((event) => toTransferEntry(event as EventLog, "received")),
      ...rewards.map((event) => toRewardEntry(event as EventLog)),
    ];

    entries.sort((a, b) => b.blockNumber - a.blockNumber);
    setHistory(entries);
  }

  function toTransferEntry(event: EventLog, type: "sent" | "received"): HistoryEntry {
    const [from, to, value] = event.args as unknown as [string, string, bigint];
    return {
      type,
      amount: formatAle(value),
      counterparty: type === "sent" ? to : from,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  function toRewardEntry(event: EventLog): HistoryEntry {
    const [, amount] = event.args as unknown as [string, bigint, bigint];
    return {
      type: "reward",
      amount: formatAle(amount),
      counterparty: CONTRACT_ADDRESS,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  async function handleTransfer() {
    setStatus(null);
    setTransferBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(transferTo, parseEther(transferAmount));
      setTransferBusy(BUSY_NETWORK);
      await tx.wait();
      setStatus("Перевод выполнен.");
      const address = await signer.getAddress();
      await loadAccountData(provider, address);
    } catch (error) {
      setStatus(translateError(error));
    } finally {
      setTransferBusy(null);
    }
  }

  return (
    <>
      <SiteHeader account={account} onConnect={handleConnect} connectBusy={connectBusy} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        {!account && (
          <>
            <Intro onConnect={handleConnect} connectBusy={connectBusy} />
            {status && (
              <div className="mt-6">
                <Notice>{status}</Notice>
              </div>
            )}
          </>
        )}

        {account && (
          <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
            <div className="grid content-start gap-4">
              <Panel title="Ваш баланс">
                <p className="font-display text-4xl font-semibold sm:text-5xl">
                  {balance ?? "…"} <span className="text-amber">ALE</span>
                </p>
              </Panel>
              <Panel title="Перевести токены">
                <div className="grid gap-3">
                  <TextField
                    label="Адрес получателя"
                    placeholder="0x…"
                    autoComplete="off"
                    spellCheck={false}
                    value={transferTo}
                    onChange={(event) => setTransferTo(event.target.value)}
                  />
                  <TextField
                    label="Сумма ALE"
                    placeholder="0"
                    inputMode="decimal"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                  />
                  <Button onClick={handleTransfer} busy={transferBusy} className="mt-1 w-full">
                    Отправить
                  </Button>
                  {status && <Notice>{status}</Notice>}
                </div>
              </Panel>
            </div>
            <Panel title="История операций">
              <HistoryList entries={history} />
            </Panel>
          </div>
        )}
      </main>
    </>
  );
}
```

- [ ] **Шаг 4: Тесты, линтер, сборка**

```bash
npm test
npm run lint
npm run build
```

Ожидается: 27 тестов PASS, линтер без ошибок, сборка успешна.

- [ ] **Шаг 5: Ручная проверка в браузере (без MetaMask)**

```bash
npm run dev
```

Открыть `http://localhost:3000/AleCoin/` (через Playwright MCP или обычный браузер):
- ширина 1280 px: шапка со значком и кнопкой «Подключить кошелёк» справа; вступление слева, карточка «Как это работает» справа; строка про Telegram под ними; шрифты — Playfair в заголовке, Inter в тексте, кириллица отображается этими шрифтами (не системным запасным);
- ширина 375 px: всё в одну колонку, кнопка в шапке скрыта, нет горизонтальной прокрутки;
- нажать «Подключить кошелёк» в браузере без MetaMask: кнопка ненадолго показывает «Подтвердите в MetaMask…», затем возвращается, и под вступлением появляется плашка «MetaMask не установлен…».

Остановить `npm run dev` (Ctrl+C).

- [ ] **Шаг 6: Коммит**

```bash
git add src/app/page.tsx src/app/intro.tsx src/app/history-list.tsx
git commit -m "Restyle home page: intro, balance, transfer form and linked history"
```

---

### Task 5: Claim page

**Файлы:**
- Переписать: `site/src/app/claim/claim-view.tsx`
- Изменить: `site/src/app/claim/page.tsx` (только fallback)

**Интерфейсы:**
- Потребляет: `SiteHeader`, `Panel`, `Eyebrow`, `Button`, `BUSY_WALLET`, `BUSY_NETWORK`, `Notice` (Задача 3); `formatAle`, `shortenAddress`, `txUrl`, `isFinalClaimError` (Задача 2); без изменений — `parseClaimLink`, `connectWallet`, `translateError`, `CONTRACT_ADDRESS`, `CONTRACT_ABI`.
- Производит: `ClaimView()` (тот же экспорт, что сейчас; используется в `claim/page.tsx`).

- [ ] **Шаг 1: Переписать `site/src/app/claim/claim-view.tsx` целиком**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { connectWallet } from "@/lib/wallet";
import { translateError, isFinalClaimError } from "@/lib/errors";
import { parseClaimLink } from "@/lib/claimLink";
import { formatAle, shortenAddress, txUrl } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel, Eyebrow } from "@/components/Panel";
import { Button, BUSY_WALLET, BUSY_NETWORK } from "@/components/Button";
import { Notice } from "@/components/Notice";

export function ClaimView() {
  const searchParams = useSearchParams();
  const claim = parseClaimLink(searchParams);
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [finalError, setFinalError] = useState(false);

  if (!claim) {
    return (
      <ClaimShell account={account}>
        <h1 className="font-display text-2xl font-semibold">Ссылка повреждена</h1>
        <p className="mt-2 text-muted">
          Проверьте, что ссылка скопирована целиком, или попросите новую.
        </p>
        <HomeLink />
      </ClaimShell>
    );
  }

  const { to, amount, nonce, signature } = claim;

  async function handleClaim() {
    setStatus(null);
    setFinalError(false);
    setBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimReward(to, amount, nonce, signature);
      setBusy(BUSY_NETWORK);
      await tx.wait();
      setClaimTxHash(tx.hash);
    } catch (error) {
      setStatus(translateError(error));
      setFinalError(isFinalClaimError(error));
    } finally {
      setBusy(null);
    }
  }

  if (claimTxHash) {
    return (
      <ClaimShell account={account}>
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-glow text-2xl text-amber"
        >
          ✓
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Токены получены!</h1>
        <p className="mt-2 text-muted">{formatAle(amount)} ALE уже в вашем кошельке</p>
        <a
          href={txUrl(claimTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-amber hover:underline"
        >
          Посмотреть транзакцию →
        </a>
        <HomeLink />
      </ClaimShell>
    );
  }

  const amountTone = finalError ? "opacity-50" : "";

  return (
    <ClaimShell account={account}>
      <Eyebrow>Вам награда</Eyebrow>
      <h1 className={`mt-3 break-all font-display text-6xl font-semibold text-amber ${amountTone}`}>
        {formatAle(amount)}
      </h1>
      <p className={`font-display text-xl ${amountTone}`}>ALE</p>
      <p className="mt-4 text-sm text-muted">
        на адрес <span className="font-mono">{shortenAddress(to)}</span>
      </p>
      {status && (
        <div className="mt-6">
          <Notice>{status}</Notice>
        </div>
      )}
      {!finalError && (
        <Button onClick={handleClaim} busy={busy} className="mt-6 w-full text-lg">
          Получить
        </Button>
      )}
    </ClaimShell>
  );
}

function ClaimShell({ account, children }: { account: string | null; children: ReactNode }) {
  return (
    <>
      <SiteHeader account={account} />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-sm px-6 py-8 text-center">{children}</Panel>
      </main>
    </>
  );
}

function HomeLink() {
  return (
    <Link href="/" className="mt-4 block text-sm text-muted hover:text-cream">
      На главную
    </Link>
  );
}
```

- [ ] **Шаг 2: Оформить fallback в `site/src/app/claim/page.tsx`**

Заменить строку

```tsx
    <Suspense fallback={<p>Загрузка…</p>}>
```

на

```tsx
    <Suspense fallback={<p className="p-10 text-center text-muted">Загрузка…</p>}>
```

- [ ] **Шаг 3: Тесты, линтер, сборка**

```bash
npm test
npm run lint
npm run build
```

Ожидается: 27 тестов PASS, линтер без ошибок, сборка успешна.

- [ ] **Шаг 4: Ручная проверка в браузере (без MetaMask)**

```bash
npm run dev
```

- `http://localhost:3000/AleCoin/claim/?to=0x58EE5eaB40A56e8243cB80139428BBDee3fad70b&amount=500000000000000000000&nonce=1&sig=0x1` при ширине 375 px: карточка по центру, «ВАМ НАГРАДА», крупное `500`, «ALE», «на адрес 0x58EE…d70b», большая кнопка «Получить»; горизонтальной прокрутки нет. Нажать «Получить» → кнопка ненадолго «Подтвердите в MetaMask…», затем плашка «MetaMask не установлен…», кнопка **осталась** (ошибка не окончательная).
- `http://localhost:3000/AleCoin/claim/` (без параметров): «Ссылка повреждена» и ссылка «На главную», которая ведёт на `/AleCoin/`.

Остановить `npm run dev`.

- [ ] **Шаг 5: Коммит**

```bash
git add src/app/claim/claim-view.tsx src/app/claim/page.tsx
git commit -m "Restyle claim page with success, error and broken-link states"
```

---

### Task 6: Admin page with copy button

**Файлы:**
- Переписать: `site/src/app/admin/admin-form.tsx`
- Переписать: `site/src/app/admin/page.tsx`

**Интерфейсы:**
- Потребляет: `SiteHeader`, `Panel`, `Button`, `BUSY_WALLET`, `TextField`, `Notice` (Задача 3); без изменений — `connectWallet`, `translateError`, `generateNonce`, `buildClaimLink`, `signClaim`, `BASE_PATH`.
- Производит: `AdminForm()` — теперь рисует всю страницу (шапку и карточку); `admin/page.tsx` только задаёт метаданные `noindex` и рендерит `<AdminForm />`.

- [ ] **Шаг 1: Переписать `site/src/app/admin/admin-form.tsx` целиком**

Логика создания ссылки (`handleCreate`) — та же, что сейчас, плюс состояние «занято», запоминание адреса для шапки и сброс надписи кнопки копирования.

```tsx
"use client";

import { useState } from "react";
import { parseEther } from "ethers";
import { connectWallet } from "@/lib/wallet";
import { translateError } from "@/lib/errors";
import { generateNonce, buildClaimLink } from "@/lib/claimLink";
import { signClaim } from "@/lib/signClaim";
import { BASE_PATH } from "@/lib/contract";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";
import { Button, BUSY_WALLET } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Notice } from "@/components/Notice";

const COPY_LABEL = "Скопировать";

export function AdminForm() {
  const [account, setAccount] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState(COPY_LABEL);

  async function handleCreate() {
    setStatus(null);
    setLink(null);
    setBusy(BUSY_WALLET);
    try {
      const provider = await connectWallet();
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
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
      setCopyLabel(COPY_LABEL);
    } catch (error) {
      setStatus(translateError(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopyLabel("Скопировано");
      setTimeout(() => setCopyLabel(COPY_LABEL), 2000);
    } catch {
      setCopyLabel("Не получилось — выделите ссылку вручную");
    }
  }

  return (
    <>
      <SiteHeader account={account} />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold">Выдача наград</h1>
          <div className="mt-5 grid gap-3">
            <TextField
              label="Адрес друга"
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <TextField
              label="Сумма ALE"
              placeholder="0"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Button onClick={handleCreate} busy={busy} className="mt-1 w-full">
              Создать награду
            </Button>
          </div>

          {status && (
            <div className="mt-5">
              <Notice>{status}</Notice>
            </div>
          )}

          {link && (
            <div className="mt-6 rounded-lg border border-amber/50 p-4">
              <p className="text-sm text-muted">Ссылка готова — отправьте её другу:</p>
              <textarea
                readOnly
                rows={5}
                value={link}
                aria-label="Ссылка на награду"
                onFocus={(event) => event.target.select()}
                className="mt-2 w-full resize-none break-all rounded-md border border-line bg-transparent px-3 py-2 font-mono text-sm text-cream focus:border-amber focus:outline-none"
              />
              <Button variant="secondary" onClick={handleCopy} className="mt-3 w-full">
                {copyLabel}
              </Button>
            </div>
          )}
        </Panel>
      </main>
    </>
  );
}
```

(`navigator.clipboard` может отсутствовать во встроенном браузере кошелька — обращение к `undefined.writeText` бросает исключение внутри `try`, и срабатывает запасная надпись.)

- [ ] **Шаг 2: Переписать `site/src/app/admin/page.tsx` целиком**

```tsx
import type { Metadata } from "next";
import { AdminForm } from "./admin-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminForm />;
}
```

- [ ] **Шаг 3: Тесты, линтер, сборка**

```bash
npm test
npm run lint
npm run build
grep -o '<meta name="robots" content="[^"]*"' out/admin/index.html
```

Ожидается: 27 тестов PASS, линтер без ошибок, сборка успешна; последняя команда выводит `<meta name="robots" content="noindex, nofollow"` (скрытость админки сохранилась).

- [ ] **Шаг 4: Ручная проверка в браузере (без MetaMask)**

```bash
npm run dev
```

`http://localhost:3000/AleCoin/admin/` при ширине 375 и 1280 px: карточка «Выдача наград», два поля с подписями, кнопка «Создать награду». Нажать её → кнопка ненадолго «Подтвердите в MetaMask…», затем плашка «MetaMask не установлен…».

Блок со ссылкой и кнопкой «Скопировать» без MetaMask не появится — он проверяется на телефоне в Задаче 7.

Остановить `npm run dev`.

- [ ] **Шаг 5: Коммит**

```bash
git add src/app/admin/admin-form.tsx src/app/admin/page.tsx
git commit -m "Restyle admin page and add copy-link button"
```

---

### Task 7: 404 page, full check and live run

**Файлы:**
- Создать: `site/src/app/not-found.tsx`

**Интерфейсы:**
- Потребляет: `SiteHeader`, `Panel` (Задача 3).
- Производит: оформленную 404 (в статическом экспорте — `out/404.html`, GitHub Pages отдаёт её для несуществующих адресов).

- [ ] **Шаг 1: `site/src/app/not-found.tsx`**

```tsx
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel } from "@/components/Panel";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-sm px-6 py-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Страница не найдена</h1>
          <p className="mt-2 text-muted">Такой страницы на сайте нет.</p>
          <Link href="/" className="mt-6 inline-block text-amber hover:underline">
            На главную
          </Link>
        </Panel>
      </main>
    </>
  );
}
```

- [ ] **Шаг 2: Полная проверка**

```bash
npm test
npm run lint
npm run build
ls out/404.html
```

Ожидается: 27 тестов PASS, линтер без ошибок, сборка успешна, `out/404.html` существует.

- [ ] **Шаг 3: Финальный визуальный обход (без MetaMask)**

```bash
npm run dev
```

Пройти все страницы при ширине **375 px** и **1280 px**, сверяя со спекой (раздел «Страницы») и с одобренными макетами в `D:\rxr\MyProject\AleCoin\.superpowers\brainstorm\178-1790847052\content\` (папка вне git, в worktree её нет — открывать по этому абсолютному пути; `pub-direction.html` — вариант A, `home-layout.html` — вариант B, `app-screens.html` — главная после подключения, `/claim` и значок «клевер»):
- `/AleCoin/` — вступление;
- `/AleCoin/claim/?to=0x58EE5eaB40A56e8243cB80139428BBDee3fad70b&amount=1234567250000000000000000&nonce=1&sig=0x1` — сумма `1 234 567.25` не выходит за карточку;
- `/AleCoin/claim/` — «Ссылка повреждена»;
- `/AleCoin/admin/` — форма;
- `/AleCoin/nope/` — 404.

На каждой: нет горизонтальной прокрутки, кириллица набрана Playfair/Inter, значок с клевером в шапке и на вкладке браузера.

Остановить `npm run dev`.

- [ ] **Шаг 4: Коммит**

```bash
git add src/app/not-found.tsx
git commit -m "Add styled 404 page"
```

- [ ] **Шаг 5: Спросить владельца проекта и опубликовать**

Пуш в `master` автоматически публикует сайт. **Спросить разрешения** перед пушем. После согласия (из корня репозитория):

```bash
git push origin master
```

(Если работа шла в отдельной ветке/worktree — сначала слить её в `master` по skill `superpowers:finishing-a-development-branch`.)

Проверить, что деплой прошёл:

```bash
curl -s "https://api.github.com/repos/0xm1dn1ght/AleCoin/actions/runs?per_page=1" | grep -E '"(status|conclusion|head_sha)"'
```

Ожидается: `"status": "completed"`, `"conclusion": "success"`, `head_sha` — последний коммит. Если API не отвечает — сначала проверить соединение (VPN вкл/выкл), это не баг кода.

- [ ] **Шаг 6: Живой прогон на телефоне (делает владелец проекта)**

Во встроенном браузере MetaMask на телефоне, два аккаунта, сеть Amoy, как при проверке 2026-09-24:
1. `https://0xm1dn1ght.github.io/AleCoin/admin/` → подключить аккаунт-владелец → создать награду → кнопка проходит «Подтвердите в MetaMask…» → появляется ссылка → «Скопировать» (должно стать «Скопировано»; если «Не получилось…» — выделить ссылку вручную и сообщить об этом).
2. Переключиться на второй аккаунт, открыть ссылку → «Получить» → «Подтвердите в MetaMask…» → «Ждём сеть…» → «Токены получены!» → «Посмотреть транзакцию →» открывает PolygonScan.
3. Открыть ту же ссылку ещё раз → «Получить» → плашка «Эта награда уже была получена.», сумма приглушена, кнопка исчезла.
4. Главная: баланс с пробелами в разрядах, в истории — «Награда» со звёздочкой, строка открывает транзакцию в PolygonScan.

Результат прогона записать в `alecoin-project-handoff.md` (раздел «Статус»), обновить строку «Статус» в `README.md` и закоммитить `README.md`.
