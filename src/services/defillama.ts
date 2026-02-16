import type { Pool, LlamaResponse } from "../types/index.js";

const POOLS_URL = "https://yields.llama.fi/pools";

const SUPPORTED_CHAINS = new Set([
  "ethereum",
  "solana",
  "polygon",
  "avalanche",
  "sui",
  "aptos",
]);

const LENDING_CATEGORIES = new Set(["lending", "cdp"]);

/** Fetches all lending pools for supported chains from DeFiLlama. */
export async function fetchLendingPools(): Promise<Pool[]> {
  const response = await fetch(POOLS_URL);
  if (!response.ok) {
    throw new Error(`DeFiLlama API returned ${response.status}`);
  }

  const result: LlamaResponse = await response.json();
  const pools: Pool[] = [];

  for (const p of result.data) {
    const chain = p.chain.toLowerCase();
    if (!SUPPORTED_CHAINS.has(chain)) continue;
    if (!LENDING_CATEGORIES.has(p.category?.toLowerCase())) continue;

    const apyBaseBorrow = p.apyBaseBorrow ?? 0;
    const apyRewardBorrow = p.apyRewardBorrow ?? 0;

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
      ltv: p.ltv ?? 0,
      category: p.category,
      stablecoin: p.stablecoin,
    });
  }

  return pools;
}

export { SUPPORTED_CHAINS };
