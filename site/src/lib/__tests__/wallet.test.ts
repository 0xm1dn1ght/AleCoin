import { describe, it, expect, afterEach } from "vitest";
import { watchWallet } from "../wallet";

type Listener = (...args: unknown[]) => void;

function fakeEthereum() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    request: async () => null,
    on(event: string, listener: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    removeListener(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
    },
    emit(event: string) {
      listeners.get(event)?.forEach((listener) => listener());
    },
  };
}

const globalWithWindow = globalThis as { window?: unknown };

afterEach(() => {
  delete globalWithWindow.window;
});

describe("watchWallet", () => {
  it("reports when the user switches account in the wallet", () => {
    const ethereum = fakeEthereum();
    globalWithWindow.window = { ethereum };
    let changes = 0;
    watchWallet(() => changes++);
    ethereum.emit("accountsChanged");
    expect(changes).toBe(1);
  });

  it("reports when the user switches network in the wallet", () => {
    const ethereum = fakeEthereum();
    globalWithWindow.window = { ethereum };
    let changes = 0;
    watchWallet(() => changes++);
    ethereum.emit("chainChanged");
    expect(changes).toBe(1);
  });

  it("stops reporting after unsubscribing", () => {
    const ethereum = fakeEthereum();
    globalWithWindow.window = { ethereum };
    let changes = 0;
    const stop = watchWallet(() => changes++);
    stop();
    ethereum.emit("accountsChanged");
    expect(changes).toBe(0);
  });

  it("does nothing when no wallet is installed", () => {
    globalWithWindow.window = {};
    expect(() => watchWallet(() => {})()).not.toThrow();
  });
});
