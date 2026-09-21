# План реализации: смарт-контракт AleCoin

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: используйте superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для выполнения плана по задачам. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Написать, протестировать и подготовить к деплою контракт `AleCoin.sol` (ERC-20 с механикой `claimReward` на основе подписи) в тестовой сети Polygon Amoy.

**Архитектура:** Проект на Hardhat 3 (TypeScript) с одним контрактом (`AleCoin.sol`, база — OpenZeppelin ERC20 + Ownable + EIP712), одним набором тестов на Mocha/Chai (стандартные переводы + механика claim), и модулем деплоя Hardhat Ignition, параметризованным по сети (тестовая Amoy, основная Polygon). Фронтенда в этом плане нет — это отдельный, следующий план, который будет использовать задеплоенный адрес контракта и его ABI.

**Стек:** Hardhat 3, `@nomicfoundation/hardhat-toolbox-mocha-ethers` (ethers v6 + Mocha + Chai matchers), OpenZeppelin Contracts 5.x, Solidity 0.8.28, Hardhat Ignition для деплоя, TypeScript.

**Спецификация:** `docs/superpowers/specs/2026-09-21-alecoin-design.md`

## Общие ограничения

- Сеть: Polygon Amoy для всей разработки и тестирования; Polygon mainnet — позже (спека: «Сеть»).
- Токен: стандартный ERC-20, фиксированный total supply, весь объём минтится на адрес владельца при деплое (спека: «Токен»).
- `claimReward(address to, uint256 amount, uint256 nonce, bytes signature)` должен проверять, что подпись над `(to, amount, nonce)` сделана владельцем контракта, через EIP-712 (открытый в спеке вопрос, решён: «предпочтителен EIP-712 как более безопасный и читаемый в MetaMask»).
- Уникальность nonce обеспечивается через `mapping(uint256 => bool) usedNonces` — nonce это произвольное значение, генерируемое на клиенте (не последовательный счётчик на контракте) — открытый в спеке вопрос, решён: клиент сам генерирует случайный nonce, так как claim-ы независимы друг от друга и не требуют общего порядка.
- Никакого backend-сервера и базы данных — вся проверка происходит в контракте (спека: «Ключевая механика»).
- Причины отката (revert) — обычные строки через `require(condition, "AleCoin: ...")`, а не кастомные Solidity-ошибки — так ошибки проще читать тому, кто только начинает с Solidity.
- Приватный ключ владельца/деплоера никогда не попадает в этот код или к агенту — `.env` в `.gitignore`, а реальный деплой в живую сеть выполняется вручную владельцем проекта, не автоматически.
- Без комментариев в коде, кроме случаев, где WHY действительно не очевиден (например, специфика EIP-712) — имена сами должны нести смысл.

---

## Структура файлов

```
AleCoin/
  hardhat.config.ts          # конфиг Hardhat: версия solidity, плагины, сети
  package.json                # npm-скрипты: compile, test
  .env.example                 # документирует нужные переменные окружения, без реальных секретов
  contracts/
    AleCoin.sol                # контракт ERC-20 + claimReward
  test/
    AleCoin.ts                 # набор тестов на Mocha/Chai
  ignition/
    modules/
      AleCoin.ts                # модуль деплоя Ignition
    parameters/
      amoy.json                 # адрес владельца + initial supply для Amoy
      polygon.json               # адрес владельца + initial supply для mainnet
```

`.gitignore` уже покрывает `node_modules/`, `.env`, `cache/`, `artifacts/`, `typechain-types/`, `coverage/` (настроено в прошлой сессии). Названия папок `cache/` и `artifacts/` по умолчанию в Hardhat 3 совпадают, менять ничего не нужно. `ignition/deployments/` — **не** в `.gitignore`: после реального (не симулированного) деплоя записи об адресе оттуда нужно закоммитить как учёт того, что реально задеплоено.

---

### Task 1: Каркас проекта на Hardhat 3

**Файлы:**
- Создать: `hardhat.config.ts`
- Создать: `package.json` (и lock-файл, через npm)
- Создать: дополнения в `.gitignore` (проверить, что текущие записи всё ещё верны)
- Тест: нет (проверяется через `npx hardhat compile`)

**Интерфейсы:**
- Результат: рабочий проект на Hardhat 3, где `npx hardhat compile` выполняется без ошибок конфигурации, с установленными `@nomicfoundation/hardhat-toolbox-mocha-ethers` и `@openzeppelin/contracts`. От этого зависят все следующие задачи.

- [ ] **Шаг 1: Инициализировать проект Hardhat**

Выполнить из `D:\rxr\MyProject\AleCoin`:

```bash
npx hardhat --init --template minimal
```

Если флаг вызовет ошибку (CLI мог немного измениться) — использовать интерактивный вариант и выбрать: проект на TypeScript, npm как менеджер пакетов, текущая папка как корень проекта:

```bash
npx hardhat --init
```

- [ ] **Шаг 2: Установить toolbox и OpenZeppelin**

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox-mocha-ethers dotenv
npm install @openzeppelin/contracts@latest
```

- [ ] **Шаг 3: Настроить `hardhat.config.ts`**

Заменить содержимое на:

```typescript
import "dotenv/config";
import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    amoy: {
      type: "http",
      chainType: "l1",
      chainId: 80002,
      url: configVariable("AMOY_RPC_URL"),
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
    },
    polygon: {
      type: "http",
      chainType: "l1",
      chainId: 137,
      url: configVariable("POLYGON_RPC_URL"),
      accounts: [configVariable("POLYGON_PRIVATE_KEY")],
    },
  },
});
```

`chainType: "l1"` здесь означает «стандартная обработка EVM-транзакций» — Polygon PoS не является OP-stack роллапом вроде Optimism/Base, поэтому особая типизация L2-транзакций не нужна.

- [ ] **Шаг 4: Создать `.env.example`**

```
AMOY_RPC_URL=
AMOY_PRIVATE_KEY=
POLYGON_RPC_URL=
POLYGON_PRIVATE_KEY=
```

- [ ] **Шаг 5: Проверить, что компиляция проходит чисто**

Выполнить: `npx hardhat compile`
Ожидается: успех (нормально, если сообщит «ноль контрактов для компиляции» — `contracts/` пока пуст).

- [ ] **Шаг 6: Коммит**

```bash
git add hardhat.config.ts package.json package-lock.json .env.example .gitignore
git commit -m "$(cat <<'EOF'
Scaffold Hardhat 3 project for AleCoin contract

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Базовый ERC-20 контракт с фиксированным supply

**Файлы:**
- Создать: `contracts/AleCoin.sol`
- Тест: `test/AleCoin.ts`

**Интерфейсы:**
- Использует: OpenZeppelin `ERC20`, `Ownable` (из `@openzeppelin/contracts`, установлен в Задаче 1).
- Результат: контракт `AleCoin` с конструктором `constructor(uint256 initialSupply, address initialOwner)`, стандартный набор ERC-20 (`balanceOf`, `transfer`, `totalSupply` и т.д.), `name() == "AleCoin"`, `symbol() == "ALE"`, `owner()` из `Ownable`. Следующие задачи (логика claim) достраиваются поверх этого файла и этого файла тестов.

- [ ] **Шаг 1: Написать падающий тест**

Создать `test/AleCoin.ts`:

```typescript
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function deployFixture() {
  const [owner, friend, other] = await ethers.getSigners();
  const initialSupply = ethers.parseEther("1000000");
  const token = await ethers.deployContract("AleCoin", [initialSupply, owner.address]);
  return { token, owner, friend, other, initialSupply };
}

describe("AleCoin", function () {
  describe("deployment", function () {
    it("sets name and symbol", async function () {
      const { token } = await deployFixture();
      expect(await token.name()).to.equal("AleCoin");
      expect(await token.symbol()).to.equal("ALE");
    });

    it("mints the full initial supply to the owner", async function () {
      const { token, owner, initialSupply } = await deployFixture();
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("sets the deployer-specified address as owner", async function () {
      const { token, owner } = await deployFixture();
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("standard transfers", function () {
    it("allows the owner to transfer tokens to another address", async function () {
      const { token, owner, friend } = await deployFixture();
      const amount = ethers.parseEther("100");

      await expect(token.transfer(friend.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, friend.address, amount);

      expect(await token.balanceOf(friend.address)).to.equal(amount);
    });
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `npx hardhat test`
Ожидается: FAIL — контракт `AleCoin` не найден / ошибка компиляции, так как `contracts/AleCoin.sol` ещё не существует.

- [ ] **Шаг 3: Написать минимальный контракт**

Создать `contracts/AleCoin.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AleCoin is ERC20, Ownable {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("AleCoin", "ALE")
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }
}
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Выполнить: `npx hardhat test`
Ожидается: PASS — все 4 теста зелёные.

- [ ] **Шаг 5: Коммит**

```bash
git add contracts/AleCoin.sol test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add base AleCoin ERC-20 contract with fixed supply

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `claimReward` с проверкой подписи через EIP-712

**Файлы:**
- Изменить: `contracts/AleCoin.sol`
- Изменить: `test/AleCoin.ts`

**Интерфейсы:**
- Использует: OpenZeppelin `EIP712`, `ECDSA` (из `@openzeppelin/contracts/utils/cryptography/`).
- Результат: внешняя функция `claimReward(address to, uint256 amount, uint256 nonce, bytes calldata signature)`; публичный геттер `usedNonces(uint256) view returns (bool)`; событие `event RewardClaimed(address indexed to, uint256 amount, uint256 nonce)`. EIP-712 домен — `{ name: "AleCoin", version: "1", chainId, verifyingContract: <адрес токена> }` с типом `Claim(address to,uint256 amount,uint256 nonce)` — фронтенд (в следующем плане) должен подписывать именно этот домен/тип.

- [ ] **Шаг 1: Написать падающий тест**

Добавить в `test/AleCoin.ts`, внутрь верхнеуровневого блока `describe("AleCoin", ...)`, новый вложенный `describe`:

```typescript
  describe("claimReward", function () {
    async function signClaim(
      token: Awaited<ReturnType<typeof ethers.deployContract>>,
      signer: Awaited<ReturnType<typeof ethers.getSigners>>[number],
      to: string,
      amount: bigint,
      nonce: bigint,
    ) {
      const { chainId } = await ethers.provider.getNetwork();
      const domain = {
        name: "AleCoin",
        version: "1",
        chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Claim: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };
      return signer.signTypedData(domain, types, { to, amount, nonce });
    }

    it("transfers tokens to the recipient when the signature is valid", async function () {
      const { token, owner, friend } = await deployFixture();
      const amount = ethers.parseEther("50");
      const nonce = 1n;
      const signature = await signClaim(token, owner, friend.address, amount, nonce);

      await expect(token.connect(friend).claimReward(friend.address, amount, nonce, signature))
        .to.emit(token, "RewardClaimed")
        .withArgs(friend.address, amount, nonce);

      expect(await token.balanceOf(friend.address)).to.equal(amount);
      expect(await token.usedNonces(nonce)).to.equal(true);
    });
  });
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Выполнить: `npx hardhat test`
Ожидается: FAIL — `token.claimReward is not a function`.

- [ ] **Шаг 3: Реализовать `claimReward`**

Заменить `contracts/AleCoin.sol` на:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract AleCoin is ERC20, Ownable, EIP712 {
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address to,uint256 amount,uint256 nonce)");

    mapping(uint256 => bool) public usedNonces;

    event RewardClaimed(address indexed to, uint256 amount, uint256 nonce);

    constructor(uint256 initialSupply, address initialOwner)
        ERC20("AleCoin", "ALE")
        Ownable(initialOwner)
        EIP712("AleCoin", "1")
    {
        _mint(initialOwner, initialSupply);
    }

    function claimReward(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(!usedNonces[nonce], "AleCoin: nonce already used");

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == owner(), "AleCoin: invalid signature");

        usedNonces[nonce] = true;
        _transfer(owner(), to, amount);

        emit RewardClaimed(to, amount, nonce);
    }
}
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Выполнить: `npx hardhat test`
Ожидается: PASS — все тесты зелёные, включая новый тест `claimReward`.

- [ ] **Шаг 5: Коммит**

```bash
git add contracts/AleCoin.sol test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add claimReward with EIP-712 signature verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Отклонение повторных nonce и поддельных подписей

**Файлы:**
- Изменить: `test/AleCoin.ts`

Изменений в контракте не ожидается — `claimReward` из Задачи 3 уже содержит обе проверки. Эта задача нужна, чтобы это доказать тестами, согласно плану тестирования из спеки («повторный claim с тем же nonce», «claim с поддельной подписью»).

**Интерфейсы:**
- Использует: `claimReward`, `usedNonces`, хелпер `signClaim` — всё из Задачи 3, без изменений.

- [ ] **Шаг 1: Написать падающие тесты**

Добавить внутрь блока `describe("claimReward", ...)` из Задачи 3:

```typescript
    it("rejects a second claim reusing the same nonce", async function () {
      const { token, owner, friend } = await deployFixture();
      const amount = ethers.parseEther("50");
      const nonce = 1n;
      const signature = await signClaim(token, owner, friend.address, amount, nonce);

      await token.connect(friend).claimReward(friend.address, amount, nonce, signature);

      await expect(
        token.connect(friend).claimReward(friend.address, amount, nonce, signature),
      ).to.be.revertedWith("AleCoin: nonce already used");
    });

    it("rejects a claim signed by someone other than the owner", async function () {
      const { token, friend, other } = await deployFixture();
      const amount = ethers.parseEther("50");
      const nonce = 2n;
      const signature = await signClaim(token, other, friend.address, amount, nonce);

      await expect(
        token.connect(friend).claimReward(friend.address, amount, nonce, signature),
      ).to.be.revertedWith("AleCoin: invalid signature");
    });
```

- [ ] **Шаг 2: Запустить тесты и проверить результат**

Выполнить: `npx hardhat test`
Ожидается: поскольку логика контракта из Задачи 3 уже обеспечивает обе проверки, тесты должны сразу пройти (PASS). Если какой-то из них упадёт — значит в реализации из Задачи 3 есть баг: нужно исправить `contracts/AleCoin.sol`, а не ослаблять тест.

- [ ] **Шаг 3: Коммит**

```bash
git add test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add tests for nonce replay and forged-signature rejection

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Модуль деплоя Ignition и деплой в тестовую сеть Amoy

**Файлы:**
- Создать: `ignition/modules/AleCoin.ts`
- Создать: `ignition/parameters/amoy.json`
- Создать: `ignition/parameters/polygon.json`
- Изменить: `README.md` (инструкции по деплою)

**Интерфейсы:**
- Результат: модуль Ignition с именем `AleCoinModule`, экспортирующий `{ token }`, пригодный и для локальных тестовых деплоев, и для реального деплоя через `--network amoy` / `--network polygon`. Следующий план (фронтенд) будет использовать адрес, записанный в `ignition/deployments/chain-80002/deployed_addresses.json` после реального деплоя в Amoy, и ABI из `artifacts/contracts/AleCoin.sol/AleCoin.json`.

- [ ] **Шаг 1: Написать модуль Ignition**

Создать `ignition/modules/AleCoin.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AleCoinModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", 1_000_000n * 10n ** 18n);
  const initialOwner = m.getParameter("initialOwner");

  const token = m.contract("AleCoin", [initialSupply, initialOwner]);

  return { token };
});
```

- [ ] **Шаг 2: Написать файлы параметров для каждой сети**

Создать `ignition/parameters/amoy.json` — заменить `"0x..."` на реальный адрес кошелька, который должен стать владельцем токена (адрес MetaMask владельца проекта):

```json
{
  "AleCoinModule": {
    "initialOwner": "0x..."
  }
}
```

Создать `ignition/parameters/polygon.json` с той же структурой (тот же или другой адрес владельца — решается на момент деплоя в mainnet):

```json
{
  "AleCoinModule": {
    "initialOwner": "0x..."
  }
}
```

- [ ] **Шаг 3: Проверить, что модуль деплоится в локальной симулированной сети Hardhat**

Выполнить: `npx hardhat ignition deploy ignition/modules/AleCoin.ts --parameters ignition/parameters/amoy.json`

Ожидается: успешный деплой в дефолтную сеть в памяти, вывод адреса `AleCoinModule#AleCoin`. Это подтверждает, что модуль и файл параметров настроены верно, прежде чем работать с реальной сетью.

- [ ] **Шаг 4: Задокументировать реальный деплой в Amoy в README**

Добавить в `README.md`:

```markdown
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
```

- [ ] **Шаг 5: Закоммитить модуль, параметры и изменения в README**

```bash
git add ignition/modules/AleCoin.ts ignition/parameters/amoy.json ignition/parameters/polygon.json README.md
git commit -m "$(cat <<'EOF'
Add Ignition deployment module and Amoy deploy instructions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Шаг 6: Реальный деплой в Amoy (вручную, силами владельца проекта, не автоматизируется)**

Выполнить по инструкции из README (добавлена на Шаге 4), в своём терминале, со своим `.env`. После этого — закоммитить получившуюся папку `ignition/deployments/chain-80002/`. Это и есть триггер для начала плана по фронтенду, которому нужен реальный адрес контракта и ABI.

---

## После этого плана

Как только выполнен Шаг 6 Задачи 5 (контракт живёт в Amoy, адрес деплоя закоммичен), можно брейнштормить и писать следующий план — фронтенд (публичная часть + админка), используя адрес и ABI этого контракта как стартовый артефакт.
