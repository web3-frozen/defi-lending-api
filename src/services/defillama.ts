import type { LlamaPoolsResponse, LlamaBorrowEntry, Pool } from "../types/index.js";
import { recordExternalRequest } from "../metrics.js";
import { borrowRate, supplyRate } from "./rates.js";

const POOLS_URL = "https://yields.llama.fi/pools";
const LEND_BORROW_URL = "https://yields.llama.fi/lendBorrow";
const PROVIDER = "defillama";

/** Normalize chain names from the API to a consistent lowercase key. */
export function normalizeChain(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === "binance" || lower === "bsc") return "bsc";
  if (lower === "hyperliquid l1" || lower === "hyperliquid") return "hyperliquid";
  if (lower === "avax" || lower === "avalanche") return "avalanche";
  if (lower === "optimism" || lower === "op mainnet") return "op mainnet";
  return lower;
}

async function fetchExternal(operation: string, url: string): Promise<Response> {
  const start = process.hrtime.bigint();

  try {
    const response = await fetch(url);
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;
    recordExternalRequest(
      PROVIDER,
      operation,
      response.ok ? "success" : "http_error",
      durationSeconds
    );
    return response;
  } catch (error) {
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;
    recordExternalRequest(
      PROVIDER,
      operation,
      "network_error",
      durationSeconds
    );
    throw error;
  }
}

/**
 * Fetches lending pools by joining /pools and /lendBorrow.
 * A pool is a lending pool if it appears in /lendBorrow.
 * Every chain in that join is included.
 */
export async function fetchLendingPools(): Promise<Pool[]> {
  const [poolsRes, borrowRes] = await Promise.all([
    fetchExternal("pools", POOLS_URL),
    fetchExternal("lend_borrow", LEND_BORROW_URL),
  ]);

  if (!poolsRes.ok) throw new Error(`DeFiLlama /pools returned ${poolsRes.status}`);
  if (!borrowRes.ok) throw new Error(`DeFiLlama /lendBorrow returned ${borrowRes.status}`);

  const poolsData: LlamaPoolsResponse = await poolsRes.json();
  const borrowData: LlamaBorrowEntry[] = await borrowRes.json();

  const borrowMap = new Map<string, LlamaBorrowEntry>();
  for (const entry of borrowData) {
    borrowMap.set(entry.pool, entry);
  }

  const pools: Pool[] = [];

  for (const p of poolsData.data) {
    const borrow = borrowMap.get(p.pool);
    if (!borrow) continue;

    const supply = supplyRate(p.apy ?? null, p.apyBase, p.apyReward);
    const borrowParts = borrowRate(borrow.apyBaseBorrow, borrow.apyRewardBorrow);

    pools.push({
      id: p.pool,
      chain: normalizeChain(p.chain),
      project: p.project,
      symbol: p.symbol,
      tvl: p.tvlUsd,
      apyBase: supply.base,
      apyReward: supply.reward,
      apy: supply.total,
      apyBaseBorrow: borrowParts.base,
      apyRewardBorrow: borrowParts.reward,
      apyBorrow: borrowParts.total,
      ltv: borrow.ltv ?? 0,
      totalSupplyUsd: borrow.totalSupplyUsd ?? p.tvlUsd,
      totalBorrowUsd: borrow.totalBorrowUsd ?? 0,
      stablecoin: p.stablecoin,
    });
  }

  return pools;
}
