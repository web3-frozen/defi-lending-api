import { describe, it, expect } from "vitest";
import { borrowRate, supplyRate } from "../services/rates.js";

describe("supplyRate", () => {
  it("adds base and reward into the total used for sorting", () => {
    expect(supplyRate(5.03868, 1.26701, 3.77168)).toEqual({
      base: 1.26701,
      reward: 3.77168,
      total: 5.03869,
    });
  });

  it("keeps a headline total when the breakdown is not reported", () => {
    expect(supplyRate(4.2, null, null)).toEqual({
      base: null,
      reward: null,
      total: 4.2,
    });
  });

  it("treats a missing part as zero when the other part is reported", () => {
    expect(supplyRate(3, 3, null)).toEqual({
      base: 3,
      reward: 0,
      total: 3,
    });
  });
});

describe("borrowRate", () => {
  it("subtracts the reward from interest", () => {
    const rate = borrowRate(3.99294, 5.25);
    expect(rate.base).toBe(3.99294);
    expect(rate.reward).toBe(5.25);
    expect(rate.total).toBeCloseTo(-1.25706);
  });

  it("returns no breakdown when both borrow parts are missing", () => {
    expect(borrowRate(null, null)).toEqual({
      base: null,
      reward: null,
      total: 0,
    });
  });
});
