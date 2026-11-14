import { Router } from "express";
import type { Request, Response } from "express";
import type { Pool, QueryParams, ChainInfo, ProtocolInfo, SymbolInfo } from "../types/index.js";
import type { PoolCache } from "../services/cache.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function createPoolRouter(cache: PoolCache): Router {
  const router = Router();

  router.get("/pools", async (req: Request, res: Response) => {
    try {
      const pools = await cache.get();
      const params = parseQuery(req);
      let filtered = filterPools(pools, params);
      sortPools(filtered, params.sortBy, params.order);

      const totalCount = filtered.length;
      if (params.limit < filtered.length) {
        filtered = filtered.slice(0, params.limit);
      }

      res.json({ data: filtered, totalCount });
    } catch {
      res.status(503).json({ error: "Failed to fetch pool data" });
    }
  });

  router.get("/chains", async (_req: Request, res: Response) => {
    try {
      const pools = await cache.get();
      const chainMap = new Map<string, number>();

      for (const p of pools) {
        chainMap.set(p.chain, (chainMap.get(p.chain) ?? 0) + 1);
      }

      const chains: ChainInfo[] = Array.from(chainMap.entries())
        .map(([name, poolCount]) => ({ name, poolCount }))
        .sort((a, b) => b.poolCount - a.poolCount);

      res.json({ data: chains });
    } catch {
      res.status(503).json({ error: "Failed to fetch data" });
    }
  });

  router.get("/symbols", async (_req: Request, res: Response) => {
    try {
      const pools = await cache.get();
      const symbolMap = new Map<string, number>();

      for (const p of pools) {
        symbolMap.set(p.symbol, (symbolMap.get(p.symbol) ?? 0) + 1);
      }

      const symbols: SymbolInfo[] = Array.from(symbolMap.entries())
        .map(([symbol, poolCount]) => ({ symbol, poolCount }))
        .sort((a, b) => b.poolCount - a.poolCount || a.symbol.localeCompare(b.symbol));

      res.json({ data: symbols });
    } catch {
      res.status(503).json({ error: "Failed to fetch data" });
    }
  });

  router.get("/protocols", async (_req: Request, res: Response) => {
    try {
      const pools = await cache.get();
      const protocolMap = new Map<string, number>();

      for (const p of pools) {
        protocolMap.set(p.project, (protocolMap.get(p.project) ?? 0) + p.tvl);
      }

      const protocols: ProtocolInfo[] = Array.from(protocolMap.entries())
        .map(([name, totalTvl]) => ({ name, totalTvl }))
        .sort((a, b) => b.totalTvl - a.totalTvl);

      res.json({ data: protocols });
    } catch {
      res.status(503).json({ error: "Failed to fetch data" });
    }
  });

  return router;
}

function parseQuery(req: Request): QueryParams {
  const q = req.query;

  let limit = Number(q.limit) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;

  const sortBy = (["tvl", "apy", "apyBorrow", "ltv"].includes(String(q.sort))
    ? String(q.sort)
    : "tvl") as QueryParams["sortBy"];

  const order = String(q.order) === "asc" ? "asc" : "desc";
  const minTvl = Number(q.minTvl) || 0;
  const symbol = q.symbol ? String(q.symbol).trim().toLowerCase() : undefined;
  const symbols = parseSymbols(q.symbols);
  const stablecoin =
    q.stablecoin === "true" ? true : q.stablecoin === "false" ? false : undefined;

  return {
    chain: q.chain ? String(q.chain).toLowerCase() : undefined,
    project: q.project ? String(q.project).toLowerCase() : undefined,
    symbol: symbol || undefined,
    symbols: symbols.length > 0 ? symbols : undefined,
    stablecoin,
    sortBy,
    order,
    limit,
    minTvl,
  };
}

function parseSymbols(value: unknown): string[] {
  const values = (Array.isArray(value) ? value : [value]).filter(
    (item) => item != null && item !== ""
  );
  return [
    ...new Set(
      values
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function matchesSymbol(symbol: string, query: string): boolean {
  return symbol.toLowerCase().includes(query);
}

function filterPools(pools: Pool[], params: QueryParams): Pool[] {
  return pools.filter((p) => {
    if (params.chain && p.chain !== params.chain) return false;
    if (params.project && p.project.toLowerCase() !== params.project) return false;
    if (params.symbol && !matchesSymbol(p.symbol, params.symbol)) return false;
    if (
      params.symbols?.length &&
      !params.symbols.some((symbol) => p.symbol.toLowerCase() === symbol)
    ) {
      return false;
    }
    if (params.stablecoin !== undefined && p.stablecoin !== params.stablecoin) return false;
    if (params.minTvl > 0 && p.tvl < params.minTvl) return false;
    return true;
  });
}

function sortPools(pools: Pool[], sortBy: string, order: string): void {
  const key = sortBy as keyof Pool;
  pools.sort((a, b) => {
    const va = Number(a[key]) || 0;
    const vb = Number(b[key]) || 0;
    return order === "asc" ? va - vb : vb - va;
  });
}
