import type { Pool, LlamaPoolsResponse, LlamaBorrowEntry } from "../types/index.js";

const POOLS_URL = "https://yields.llama.fi/pools";
const LEND_BORROW_URL = "https://yields.llama.fi/lendBorrow";

const SUPPORTED_CHAINS = new Set([
  "ethereum",
  "solana",
  "polygon",
  "avalanche",
  "sui",
  "aptos",
  "bsc",
  "base",
  "hyperliquid",
  "arbitrum",
]);

/** Normalize chain names from the API to a consistent lowercase key. */
function normalizeChain(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === "binance" || lower === "bsc") return "bsc";
  if (lower === "hyperliquid l1" || lower === "hyperliquid") return "hyperliquid";
  if (lower === "avax" || lower === "avalanche") return "avalanche";
  return lower;
}

/**
 * Fetches lending pools by joining /pools and /lendBorrow endpoints.
 * A pool is considered a lending pool if it appears in /lendBorrow.
 */
export async function fetchLendingPools(): Promise<Pool[]> {
  const [poolsRes, borrowRes] = await Promise.all([
    fetch(POOLS_URL),
    fetch(LEND_BORROW_URL),
  ]);

  if (!poolsRes.ok) throw new Error(`DeFiLlama /pools returned ${poolsRes.status}`);
  if (!borrowRes.ok) throw new Error(`DeFiLlama /lendBorrow returned ${borrowRes.status}`);

  const poolsData: LlamaPoolsResponse = await poolsRes.json();
  const borrowData: LlamaBorrowEntry[] = await borrowRes.json();

  // Build a lookup map from pool ID → borrow data
  const borrowMap = new Map<string, LlamaBorrowEntry>();
  for (const b of borrowData) {
    borrowMap.set(b.pool, b);
  }

  const pools: Pool[] = [];

  for (const p of poolsData.data) {
    const chain = normalizeChain(p.chain);
    if (!SUPPORTED_CHAINS.has(chain)) continue;

    // Only include pools that appear in the lendBorrow endpoint
    const borrow = borrowMap.get(p.pool);
    if (!borrow) continue;

    const apyBaseBorrow = borrow.apyBaseBorrow ?? 0;
    const apyRewardBorrow = borrow.apyRewardBorrow ?? 0;

    pools.push({
      id: p.pool,
      chain,
      project: p.project,
      symbol: p.symbol,
      tvl: p.tvlUsd,
      apyBase: p.apyBase ?? 0,
      apyReward: p.apyReward ?? 0,
      apy: p.apy ?? 0,
      apyBaseBorrow,
      apyRewardBorrow,
      apyBorrow: apyBaseBorrow + apyRewardBorrow,
      ltv: borrow.ltv ?? 0,
      totalSupplyUsd: borrow.totalSupplyUsd ?? p.tvlUsd,
      totalBorrowUsd: borrow.totalBorrowUsd ?? 0,
      stablecoin: p.stablecoin,
    });
  }

  return pools;
}

export { SUPPORTED_CHAINS, normalizeChain };
