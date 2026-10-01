# AleCoin (ALE)

Учебный крипто-проект (портфолио, проект #2). ERC-20 токен на Polygon с механикой ручной выдачи наград через подписанные ссылки-коды.

Статус: контракт и сайт готовы и работают в тестовой сети Polygon Amoy. Полный сценарий (выдача награды → получение по ссылке другим кошельком → повторная ссылка отклонена, обычный перевод, история операций) проверен вживую с телефона во встроенном браузере MetaMask. Дальше — переезд в Polygon mainnet. Спецификации — в `docs/superpowers/specs/`, планы реализации — в `docs/superpowers/plans/`.

## Сайт

- Адрес: https://0xm1dn1ght.github.io/AleCoin/ (GitHub Pages, автодеплой при пуше в `master`).
- Код: `site/` — Next.js (статический экспорт) + TypeScript + Tailwind CSS v4 + ethers.js v6, без backend.
- Страницы: `/` — баланс, перевод и история операций; `/claim` — получение награды по ссылке; `/admin` — скрытая страница выдачи наград (подпись EIP-712 в MetaMask → одноразовая ссылка).
- История операций берётся через `alchemy_getAssetTransfers`: бесплатный тариф Alchemy ограничивает `eth_getLogs` диапазоном в 10 блоков.
- Комиссию сайт предлагает сам (`maxPriorityFeePerGas` не ниже 30 gwei): Polygon отклоняет транзакции с чаевыми ниже 25 gwei, а MetaMask mobile по умолчанию ставит 1.5 gwei.
- Локально: `cd site && npm install && npm run dev` → http://localhost:3000/AleCoin/. Тесты: `npm test`, проверка сборки: `npm run build`.

## Текущий деплой (Polygon Amoy)

- Контракт: `0x44e8b28c3b059EeAb4C84d78bffe1808067997b5`
- Посмотреть: https://amoy.polygonscan.com/address/0x44e8b28c3b059EeAb4C84d78bffe1808067997b5
- Адрес и ABI также сохранены в `ignition/deployments/chain-80002/`.

## Деплой в Polygon Amoy (тестовая сеть)

Это делается вручную, приватный ключ никому не передаётся.

1. Скопировать `.env.example` в `.env`.
2. Получить тестовые POL на адрес владельца через любой публичный Amoy-faucet.
3. Заполнить в `.env`:
   - `AMOY_RPC_URL` — RPC-эндпоинт Amoy (например, от Alchemy/Infura, бесплатный тариф).
   - `AMOY_PRIVATE_KEY` — приватный ключ кошелька, из которого будет оплачен деплой
     (используйте отдельный тестовый кошелёк, не тот, где хранятся реальные средства).
4. Проверить/заполнить адрес владельца в `ignition/parameters/amoy.json`.
5. Запустить:
   ```bash
   npx hardhat ignition deploy ignition/modules/AleCoin.ts --network amoy --parameters ignition/parameters/amoy.json
   ```
6. Закоммитить `ignition/deployments/chain-80002/` — там сохранится адрес
   задеплоенного контракта, он понадобится для фронтенда.
