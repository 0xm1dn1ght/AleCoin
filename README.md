# AleCoin (ALE)

Учебный крипто-проект (портфолио, проект #2). ERC-20 токен на Polygon с механикой ручной выдачи наград через подписанные ссылки-коды.

Статус: контракт написан, протестирован и задеплоен в тестовую сеть Polygon Amoy. Дальше — сайт (публичная часть + админка). Спецификация — в `docs/superpowers/specs/`, план реализации контракта — в `docs/superpowers/plans/`.

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
