import type { NextFunction, Request, Response } from "express";
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "@prometheus-io/client";

export const registry = new Registry();

collectDefaultMetrics({
  prefix: "defi_lending_",
  register: registry,
});

const httpRequests = new Counter({
  name: "defi_lending_http_requests_total",
  help: "Total HTTP requests by low-cardinality route and status class.",
  labelNames: ["method", "route", "status_class"] as const,
  registers: [registry],
});

const httpRequestDuration = new Histogram({
  name: "defi_lending_http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const externalRequests = new Counter({
  name: "defi_lending_external_requests_total",
  help: "External HTTP requests by provider, operation, and outcome.",
  labelNames: ["operation", "outcome", "provider"] as const,
  registers: [registry],
});

const externalRequestDuration = new Histogram({
  name: "defi_lending_external_request_duration_seconds",
  help: "External HTTP request duration in seconds.",
  labelNames: ["operation", "outcome", "provider"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [registry],
});

export const cacheRefreshDuration = new Histogram({
  name: "defi_lending_cache_refresh_duration_seconds",
  help: "Background cache refresh duration in seconds.",
  labelNames: ["outcome"] as const,
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [registry],
});

export const cacheReady = new Gauge({
  name: "defi_lending_cache_ready",
  help: "Whether the lending pool cache has a successful snapshot.",
  registers: [registry],
});

export const cacheLastSuccess = new Gauge({
  name: "defi_lending_cache_last_success_timestamp_seconds",
  help: "Unix timestamp of the last successful cache refresh.",
  registers: [registry],
});

export function requestLabel(req: Request): string {
  const routePath = req.route?.path;
  if (typeof routePath !== "string" || routePath.length === 0) {
    return "unmatched";
  }
  return `${req.baseUrl}${routePath}`;
}

export function httpMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = requestLabel(req);
    const statusClass = `${Math.floor(res.statusCode / 100)}xx`;
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;

    httpRequests.inc({
      method: req.method,
      route,
      status_class: statusClass,
    });
    httpRequestDuration.observe(
      { method: req.method, route },
      durationSeconds
    );
  });

  next();
}

export function recordExternalRequest(
  provider: string,
  operation: string,
  outcome: string,
  durationSeconds: number
): void {
  const labels = { operation, outcome, provider };
  externalRequests.inc(labels);
  externalRequestDuration.observe(labels, durationSeconds);
}
