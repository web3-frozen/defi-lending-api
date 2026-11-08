import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLendingPools } from "../services/defillama.js";
import {
  httpMetrics,
  recordExternalRequest,
  registry,
} from "../metrics.js";

describe("application metrics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records bounded HTTP route and status-class labels", async () => {
    const app = express();
    app.use(httpMetrics);
    app.get("/api/metrics-test", (_req, res) => {
      res.status(503).json({ error: "unavailable" });
    });

    await request(app).get("/api/metrics-test").expect(503);

    const output = await registry.metrics();
    expect(output).toContain(
      'defi_lending_http_requests_total{method="GET",route="/api/metrics-test",status_class="5xx"} 1'
    );
    expect(output).toContain(
      'defi_lending_http_request_duration_seconds_count{method="GET",route="/api/metrics-test"} 1'
    );
  });

  it("records external dependency latency by provider and operation", async () => {
    recordExternalRequest("defillama", "pools", "success", 0.25);

    const output = await registry.metrics();
    expect(output).toContain(
      'defi_lending_external_request_duration_seconds_count{operation="pools",outcome="success",provider="defillama"} 1'
    );
    expect(output).toContain(
      'defi_lending_external_requests_total{operation="pools",outcome="success",provider="defillama"} 1'
    );
  });

  it("records each DeFiLlama request when refreshing lending data", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: [] }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([]), { status: 200 })
        )
    );

    await fetchLendingPools();

    const output = await registry.metrics();
    expect(output).toMatch(
      /^defi_lending_external_request_duration_seconds_count\{operation="lend_borrow",outcome="success",provider="defillama"\} [1-9]\d*$/m
    );
    expect(output).toMatch(
      /^defi_lending_external_request_duration_seconds_count\{operation="pools",outcome="success",provider="defillama"\} [1-9]\d*$/m
    );
  });
});
