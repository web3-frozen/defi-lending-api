import type { Request, Response, NextFunction } from "express";

/** Adds permissive CORS headers. */
export function cors(req: Request, res: Response, next: NextFunction): void {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}
