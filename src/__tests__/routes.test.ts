import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { PoolCache } from "../services/cache.js";
import { createPoolRouter } from "../routes/pools.js";
import { createHealthRouter } from "../routes/health.js";
import type { Pool } from "../types/index.js";

const mockPools: Pool[] = [
  {
    id: "pool-1",
    chain: "ethereum",
    project: "aave-v3",
    symbol: "USDC",
    tvl: 2_000_000,
    apyBase: 3.5,
    apyReward: 0.5,
    apy: 4.0,
    apyBaseBorrow: 5.0,
    apyRewardBorrow: 0,
    apyBorrow: 5.0,
    ltv: 0.8,
    totalSupplyUsd: 2_000_000,
    totalBorrowUsd: 1_200_000,
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
  {
    id: "pool-3",
    chain: "ethereum",
    project: "compound-v3",
    symbol: "ETH",
    tvl: 1_500_000,
    apyBase: 2.0,
    apyReward: 0.3,
    apy: 2.3,
    apyBaseBorrow: 4.5,
    apyRewardBorrow: 0,
    apyBorrow: 4.5,
    ltv: 0.75,
    totalSupplyUsd: 1_500_000,
    totalBorrowUsd: 800_000,
    stablecoin: false,
  },
];

function createTestApp() {
  const cache = new PoolCache(60_000, async () => mockPools);
  const app = express();
  app.use(createHealthRouter(cache));
  app.use("/api", createPoolRouter(cache));
  return app;
}

describe("Pool Routes", () => {
  const app = createTestApp();

  it("GET /api/pools returns all pools sorted by TVL desc", async () => {
    const res = await request(app).get("/api/pools");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].tvl).toBeGreaterThanOrEqual(res.body.data[1].tvl);
  });

  it("GET /api/pools?chain=ethereum filters by chain", async () => {
    const res = await request(app).get("/api/pools?chain=ethereum");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p: Pool) => p.chain === "ethereum")).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("GET /api/pools?sort=apy&order=asc sorts ascending", async () => {
    const res = await request(app).get("/api/pools?sort=apy&order=asc");
    expect(res.status).toBe(200);
    expect(res.body.data[0].apy).toBeLessThanOrEqual(res.body.data[1].apy);
  });

  it("GET /api/pools?limit=1 limits results", async () => {
    const res = await request(app).get("/api/pools?limit=1");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("GET /api/pools?minTvl=1000000 filters by minimum TVL", async () => {
    const res = await request(app).get("/api/pools?minTvl=1000000");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p: Pool) => p.tvl >= 1_000_000)).toBe(true);
  });

  it("GET /api/chains returns chain info", async () => {
    const res = await request(app).get("/api/chains");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("poolCount");
  });

  it("GET /api/protocols returns protocol info", async () => {
    const res = await request(app).get("/api/protocols");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("totalTvl");
  });
});

describe("Health Routes", () => {
  it("GET /healthz returns ok", async () => {
    const cache = new PoolCache(60_000, async () => []);
    const app = express();
    app.use(createHealthRouter(cache));

    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });

  it("GET /readyz returns 503 when not ready", async () => {
    const cache = new PoolCache(60_000, async () => []);
    const app = express();
    app.use(createHealthRouter(cache));

    const res = await request(app).get("/readyz");
    expect(res.status).toBe(503);
  });
});
