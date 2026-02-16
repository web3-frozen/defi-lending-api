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
  totalSupplyUsd: number;
  totalBorrowUsd: number;
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
  stablecoin: boolean;
}

export interface LlamaPoolsResponse {
  status: string;
  data: LlamaPool[];
}

/** Raw entry from DeFiLlama /lendBorrow endpoint. */
export interface LlamaBorrowEntry {
  pool: string;
  apyBaseBorrow: number | null;
  apyRewardBorrow: number | null;
  totalSupplyUsd: number | null;
  totalBorrowUsd: number | null;
  ltv: number | null;
  borrowable: boolean | null;
}
