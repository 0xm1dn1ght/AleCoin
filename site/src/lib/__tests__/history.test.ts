import { describe, it, expect } from "vitest";
import { buildHistory, REWARD_CLAIMED_TOPIC, type AssetTransfer } from "../history";
import { CONTRACT_ADDRESS } from "../contract";

const ME = "0x437e5e5a582c2dd5e656855c954c4750e0a5923f";
const OWNER = "0x58ee5eab40a56e8243cb80139428bbdee3fad70b";
const FRIEND = "0x3a0ba64f604fa26fc379b28980e49822f0e9966e";

function transfer(hash: string, block: number, from: string, to: string, ale: bigint): AssetTransfer {
  return {
    blockNum: "0x" + block.toString(16),
    hash,
    from,
    to,
    rawContract: { value: "0x" + (ale * 10n ** 18n).toString(16) },
  };
}

describe("REWARD_CLAIMED_TOPIC", () => {
  it("matches the RewardClaimed event topic emitted by the deployed contract", () => {
    expect(REWARD_CLAIMED_TOPIC).toBe(
      "0xf01da32686223933d8a18a391060918c7f11a3648639edd87ae013e2e2731743",
    );
  });
});

describe("buildHistory", () => {
  it("turns outgoing transfers into sent entries with the recipient as counterparty", () => {
    const sent = [transfer("0xa1", 10, ME, FRIEND, 5n)];
    expect(buildHistory(sent, [], new Set())).toEqual([
      { type: "sent", amount: "5", counterparty: FRIEND, txHash: "0xa1", blockNumber: 10 },
    ]);
  });

  it("turns incoming transfers into received entries with the sender as counterparty", () => {
    const received = [transfer("0xb1", 11, FRIEND, ME, 1250n)];
    expect(buildHistory([], received, new Set())).toEqual([
      { type: "received", amount: "1\u00a0250", counterparty: FRIEND, txHash: "0xb1", blockNumber: 11 },
    ]);
  });

  it("marks incoming transfers from reward claims as rewards", () => {
    const received = [transfer("0xC1", 12, OWNER, ME, 15n)];
    expect(buildHistory([], received, new Set(["0xc1"]))).toEqual([
      { type: "reward", amount: "15", counterparty: CONTRACT_ADDRESS, txHash: "0xC1", blockNumber: 12 },
    ]);
  });

  it("orders entries from newest to oldest block", () => {
    const sent = [transfer("0xa1", 10, ME, FRIEND, 1n)];
    const received = [transfer("0xb1", 30, FRIEND, ME, 2n), transfer("0xb2", 20, FRIEND, ME, 3n)];
    expect(buildHistory(sent, received, new Set()).map((entry) => entry.blockNumber)).toEqual([
      30, 20, 10,
    ]);
  });
});
