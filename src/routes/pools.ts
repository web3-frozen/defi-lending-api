import { Router } from "express";
import type { Request, Response } from "express";
import type { Pool, QueryParams, ChainInfo, ProtocolInfo } from "../types/index.js";
import type { PoolCache } from "../services/cache.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function createPoolRouter(cache: PoolCache): Router {
  const router = Router();

  router.get("/pools", async (_req: Request, res: Response) => {
    try {
      const pools = await cache.get();
      const params = parseQuery(_req);
      let filtered = filterPools(pools, params);
      sortPools(filtered, params.sortBy, params.order);

      if (params.limit < filtered.length) {
        filtered = filtered.slice(0, params.limit);
      }

      res.json({ data: filtered, totalCount: filtered.length });
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

  return {
    chain: q.chain ? String(q.chain).toLowerCase() : undefined,
    project: q.project ? String(q.project).toLowerCase() : undefined,
    sortBy,
    order,
    limit,
    minTvl,
  };
}

function filterPools(pools: Pool[], params: QueryParams): Pool[] {
  return pools.filter((p) => {
    if (params.chain && p.chain !== params.chain) return false;
    if (params.project && p.project.toLowerCase() !== params.project) return false;
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
