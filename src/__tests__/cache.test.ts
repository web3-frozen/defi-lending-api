import { describe, it, expect, vi, beforeEach } from "vitest";
import { PoolCache } from "../services/cache.js";
import type { Pool } from "../types/index.js";

const mockPools: Pool[] = [
  {
    id: "pool-1",
    chain: "ethereum",
    project: "aave-v3",
    symbol: "USDC",
    tvl: 1_000_000,
    apyBase: 3.5,
    apyReward: 0.5,
    apy: 4.0,
    apyBaseBorrow: 5.0,
    apyRewardBorrow: 0,
    apyBorrow: 5.0,
    ltv: 0.8,
    totalSupplyUsd: 1_000_000,
    totalBorrowUsd: 600_000,
    stablecoin: true,
  },
  {
    id: "pool-2",
    chain: "solana",
    project: "marginfi",
    symbol: "SOL",
    tvl: 500_000,
    apyBase: 6.0,
    apyReward: 1.0,
    apy: 7.0,
    apyBaseBorrow: 8.0,
    apyRewardBorrow: 0,
    apyBorrow: 8.0,
    ltv: 0.65,
    totalSupplyUsd: 500_000,
    totalBorrowUsd: 200_000,
    stablecoin: false,
  },
];

describe("PoolCache", () => {
  let fetcher: ReturnType<typeof vi.fn>;
  let cache: PoolCache;

  beforeEach(() => {
    fetcher = vi.fn().mockResolvedValue(mockPools);
    cache = new PoolCache(60_000, fetcher);
  });

  it("fetches data on first get()", async () => {
    const pools = await cache.get();
    expect(pools).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns cached data on subsequent get()", async () => {
    await cache.get();
    await cache.get();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("reports ready after successful fetch", async () => {
    expect(cache.ready).toBe(false);
    await cache.get();
    expect(cache.ready).toBe(true);
  });
});
