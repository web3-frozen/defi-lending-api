import { Router } from "express";
import type { Request, Response } from "express";
import type { PoolCache } from "../services/cache.js";

export function createHealthRouter(cache: PoolCache): Router {
  const router = Router();

  router.get("/healthz", (_req: Request, res: Response) => {
    res.set("Content-Type", "text/plain").send("ok");
  });

  router.get("/readyz", (_req: Request, res: Response) => {
    if (!cache.ready) {
      res.status(503).set("Content-Type", "text/plain").send("not ready");
      return;
    }
    res.set("Content-Type", "text/plain").send("ok");
  });

  return router;
}
