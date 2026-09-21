# AleCoin Smart Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, and prepare for deployment the `AleCoin.sol` ERC-20 contract with its signature-based `claimReward` mechanic, on Polygon Amoy testnet.

**Architecture:** A Hardhat 3 project (TypeScript) with one contract (`AleCoin.sol`, OpenZeppelin ERC-20 + Ownable + EIP712 base), one Mocha/Chai test suite covering standard transfers and the claim mechanic, and a Hardhat Ignition deployment module parameterized per network (Amoy testnet, Polygon mainnet). No frontend in this plan — that is a separate, later plan that consumes this contract's deployed address and ABI.

**Tech Stack:** Hardhat 3, `@nomicfoundation/hardhat-toolbox-mocha-ethers` (ethers v6 + Mocha + Chai matchers), OpenZeppelin Contracts 5.x, Solidity 0.8.28, Hardhat Ignition for deployment, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-21-alecoin-design.md`

## Global Constraints

- Network: Polygon Amoy for all testing/first deployment; Polygon mainnet later (spec: "Сеть").
- Token: standard ERC-20, fixed total supply, fully minted to the owner address at deploy time (spec: "Токен").
- `claimReward(address to, uint256 amount, uint256 nonce, bytes signature)` must verify the signature was produced by the contract owner over `(to, amount, nonce)` via EIP-712 (spec's deferred decision, resolved: "предпочтителен EIP-712 как более безопасный и читаемый в MetaMask").
- Nonce uniqueness is enforced via `mapping(uint256 => bool) usedNonces` — nonces are arbitrary values generated off-chain (client-side), not a sequential on-chain counter (spec's deferred decision, resolved: client-generated random nonce, since claims are per-recipient and don't need global ordering).
- No backend server, no database — all verification happens in the contract (spec: "Ключевая механика").
- Revert reasons use plain `require(condition, "AleCoin: ...")` strings, not custom Solidity errors — keeps failures readable for someone new to Solidity (Anton has no professional dev background).
- Deployer's/owner's private key never touches this codebase or an agent's hands — `.env` is gitignored, and the actual live-network deploy step is run manually by the project owner, not automated.
- No code comments except where a WHY is genuinely non-obvious (e.g. a specific EIP-712 quirk) — identifiers should carry the meaning.

---

## File Structure

```
AleCoin/
  hardhat.config.ts          # Hardhat config: solidity version, plugins, networks
  package.json                # npm scripts: compile, test
  .env.example                 # documents required env vars, no real secrets
  contracts/
    AleCoin.sol                # the ERC-20 + claimReward contract
  test/
    AleCoin.ts                 # Mocha/Chai test suite
  ignition/
    modules/
      AleCoin.ts                # Ignition deployment module
    parameters/
      amoy.json                 # owner address + initial supply for Amoy
      polygon.json               # owner address + initial supply for mainnet
```

`.gitignore` already covers `node_modules/`, `.env`, `cache/`, `artifacts/`, `typechain-types/`, `coverage/` (set up in a prior session). Hardhat 3's default `cache/` and `artifacts/` directory names match, so no changes needed there. `ignition/deployments/` is **not** gitignored — after a real (non-simulated) deploy, the address records it writes there should be committed as a record of what's live.

---

### Task 1: Scaffold the Hardhat 3 project

**Files:**
- Create: `hardhat.config.ts`
- Create: `package.json` (and lockfile, via npm)
- Create: `.gitignore` additions (verify existing entries still correct)
- Test: none (smoke-tested via `npx hardhat compile`)

**Interfaces:**
- Produces: a working Hardhat 3 project where `npx hardhat compile` runs without configuration errors, with `@nomicfoundation/hardhat-toolbox-mocha-ethers` and `@openzeppelin/contracts` installed. Later tasks depend on this.

- [ ] **Step 1: Initialize the Hardhat project**

Run from `D:\rxr\MyProject\AleCoin`:

```bash
npx hardhat --init --template minimal
```

If that flag errors (CLI surface may have shifted), fall back to the interactive form and choose: TypeScript project, npm as package manager, current directory as project root:

```bash
npx hardhat --init
```

- [ ] **Step 2: Install the toolbox and OpenZeppelin**

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox-mocha-ethers dotenv
npm install @openzeppelin/contracts@latest
```

- [ ] **Step 3: Configure `hardhat.config.ts`**

Replace its contents with:

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

`chainType: "l1"` means "standard EVM transaction handling" here — Polygon PoS is not an OP-stack rollup like Optimism/Base, so it doesn't need special L2 transaction typing.

- [ ] **Step 4: Create `.env.example`**

```
AMOY_RPC_URL=
AMOY_PRIVATE_KEY=
POLYGON_RPC_URL=
POLYGON_PRIVATE_KEY=
```

- [ ] **Step 5: Verify compile runs clean**

Run: `npx hardhat compile`
Expected: succeeds (it's fine if it reports zero contracts to compile — `contracts/` is still empty at this point).

- [ ] **Step 6: Commit**

```bash
git add hardhat.config.ts package.json package-lock.json .env.example .gitignore
git commit -m "$(cat <<'EOF'
Scaffold Hardhat 3 project for AleCoin contract

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Base ERC-20 contract with fixed supply

**Files:**
- Create: `contracts/AleCoin.sol`
- Test: `test/AleCoin.ts`

**Interfaces:**
- Consumes: OpenZeppelin `ERC20`, `Ownable` (from `@openzeppelin/contracts`, installed in Task 1).
- Produces: `AleCoin` contract with constructor `constructor(uint256 initialSupply, address initialOwner)`, standard ERC-20 surface (`balanceOf`, `transfer`, `totalSupply`, etc.), `name() == "AleCoin"`, `symbol() == "ALE"`, `owner()` from `Ownable`. Later tasks (claim logic) build on this file and this test file.

- [ ] **Step 1: Write the failing test**

Create `test/AleCoin.ts`:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx hardhat test`
Expected: FAIL — `AleCoin` contract not found / compile error, since `contracts/AleCoin.sol` doesn't exist yet.

- [ ] **Step 3: Write the minimal contract**

Create `contracts/AleCoin.sol`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx hardhat test`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add contracts/AleCoin.sol test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add base AleCoin ERC-20 contract with fixed supply

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `claimReward` with EIP-712 signature verification

**Files:**
- Modify: `contracts/AleCoin.sol`
- Modify: `test/AleCoin.ts`

**Interfaces:**
- Consumes: OpenZeppelin `EIP712`, `ECDSA` (from `@openzeppelin/contracts/utils/cryptography/`).
- Produces: `claimReward(address to, uint256 amount, uint256 nonce, bytes calldata signature)` external function; `usedNonces(uint256) view returns (bool)` public mapping getter; `event RewardClaimed(address indexed to, uint256 amount, uint256 nonce)`. The EIP-712 domain is `{ name: "AleCoin", version: "1", chainId, verifyingContract: <token address> }` with type `Claim(address to,uint256 amount,uint256 nonce)` — the frontend plan (later) signs against this exact domain/type.

- [ ] **Step 1: Write the failing test**

Add to `test/AleCoin.ts`, inside the top-level `describe("AleCoin", ...)` block, a new nested `describe`:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx hardhat test`
Expected: FAIL — `token.claimReward is not a function`.

- [ ] **Step 3: Implement `claimReward`**

Replace `contracts/AleCoin.sol` with:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx hardhat test`
Expected: PASS — all tests green, including the new `claimReward` test.

- [ ] **Step 5: Commit**

```bash
git add contracts/AleCoin.sol test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add claimReward with EIP-712 signature verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Reject replayed nonces and forged signatures

**Files:**
- Modify: `test/AleCoin.ts`

No contract changes are expected — Task 3's `claimReward` already contains both checks. This task exists to prove it, per the spec's test plan ("повторный claim с тем же nonce", "claim с поддельной подписью").

**Interfaces:**
- Consumes: `claimReward`, `usedNonces`, `signClaim` helper — all from Task 3, unchanged.

- [ ] **Step 1: Write the failing tests**

Add inside the `describe("claimReward", ...)` block from Task 3:

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

- [ ] **Step 2: Run tests to verify they fail or pass as expected**

Run: `npx hardhat test`
Expected: since the contract logic from Task 3 already enforces both checks, these should PASS immediately. If either fails, that means Task 3's implementation has a bug — fix `contracts/AleCoin.sol` before proceeding (do not weaken the test).

- [ ] **Step 3: Commit**

```bash
git add test/AleCoin.ts
git commit -m "$(cat <<'EOF'
Add tests for nonce replay and forged-signature rejection

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Ignition deployment module and Amoy testnet deploy

**Files:**
- Create: `ignition/modules/AleCoin.ts`
- Create: `ignition/parameters/amoy.json`
- Create: `ignition/parameters/polygon.json`
- Modify: `README.md` (deploy instructions)

**Interfaces:**
- Produces: an Ignition module named `AleCoinModule` exporting `{ token }`, usable both for local test deploys and for `--network amoy` / `--network polygon` live deploys. Later (frontend) plan consumes the deployed address written to `ignition/deployments/chain-80002/deployed_addresses.json` after a real Amoy deploy, plus the ABI from `artifacts/contracts/AleCoin.sol/AleCoin.json`.

- [ ] **Step 1: Write the Ignition module**

Create `ignition/modules/AleCoin.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AleCoinModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", 1_000_000n * 10n ** 18n);
  const initialOwner = m.getParameter("initialOwner");

  const token = m.contract("AleCoin", [initialSupply, initialOwner]);

  return { token };
});
```

- [ ] **Step 2: Write per-network parameter files**

Create `ignition/parameters/amoy.json` — replace `"0x..."` with the actual wallet address that should own the token (the project owner's MetaMask address):

```json
{
  "AleCoinModule": {
    "initialOwner": "0x..."
  }
}
```

Create `ignition/parameters/polygon.json` with the same structure (same or different owner address, decided at mainnet-deploy time):

```json
{
  "AleCoinModule": {
    "initialOwner": "0x..."
  }
}
```

- [ ] **Step 3: Verify the module deploys on Hardhat's local simulated network**

Run: `npx hardhat ignition deploy ignition/modules/AleCoin.ts --parameters ignition/parameters/amoy.json`

Expected: deploys successfully against the default in-memory network and prints the deployed `AleCoinModule#AleCoin` address. This proves the module and parameter file are wired correctly before touching a real network.

- [ ] **Step 4: Document the real Amoy deploy in the README**

Add to `README.md`:

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

- [ ] **Step 5: Commit the module, parameters, and README changes**

```bash
git add ignition/modules/AleCoin.ts ignition/parameters/amoy.json ignition/parameters/polygon.json README.md
git commit -m "$(cat <<'EOF'
Add Ignition deployment module and Amoy deploy instructions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Real Amoy deploy (manual, by the project owner, not automated)**

Follow the README section added in Step 4, in your own terminal, with your own `.env`. Once done, come back and commit the resulting `ignition/deployments/chain-80002/` folder — this is the trigger for starting the frontend plan, since it needs the real contract address and ABI.

---

## After This Plan

Once Task 5 Step 6 is done (contract live on Amoy with a committed deployed address), the next plan — frontend (public site + admin page) — can be brainstormed and written, using this contract's address and ABI as its starting artifact.
