import { describe, it, expect } from "vitest";
import { computeFees, MIN_PRIORITY_FEE } from "../fees";

const GWEI = 10n ** 9n;

describe("computeFees", () => {
  it("never offers a tip below the network minimum", () => {
    expect(computeFees(63n, 1n * GWEI).maxPriorityFeePerGas).toBe(MIN_PRIORITY_FEE);
  });

  it("keeps the network's suggested tip when it is higher than the minimum", () => {
    expect(computeFees(63n, 144n * GWEI).maxPriorityFeePerGas).toBe(144n * GWEI);
  });

  it("caps the total fee at twice the base fee plus the tip", () => {
    expect(computeFees(10n * GWEI, 144n * GWEI).maxFeePerGas).toBe(164n * GWEI);
  });

  it("sets the minimum tip at 30 gwei, above Amoy's 25 gwei floor", () => {
    expect(MIN_PRIORITY_FEE).toBe(30n * GWEI);
  });
});
