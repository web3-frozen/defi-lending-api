/** Pool represents a single lending pool from a DeFi protocol. */
export interface Pool {
  id: string;
  chain: string;
  project: string;
  symbol: string;
  tvl: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  apyBaseBorrow: number;
  apyRewardBorrow: number;
  apyBorrow: number;
  ltv: number;
  category: string;
  stablecoin: boolean;
}

export interface PoolsResponse {
  data: Pool[];
  totalCount: number;
}

export interface ChainInfo {
  name: string;
  poolCount: number;
}

export interface ProtocolInfo {
  name: string;
  totalTvl: number;
}

export interface QueryParams {
  chain?: string;
  project?: string;
  sortBy: "tvl" | "apy" | "apyBorrow" | "ltv";
  order: "asc" | "desc";
  limit: number;
  minTvl: number;
}

/** Raw pool shape from DeFiLlama /pools endpoint. */
export interface LlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  apyBaseBorrow: number | null;
  apyRewardBorrow: number | null;
  ltv: number | null;
  category: string;
  stablecoin: boolean;
}

export interface LlamaResponse {
  status: string;
  data: LlamaPool[];
}
