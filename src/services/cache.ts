import type { Pool } from "../types/index.js";
import {
  cacheLastSuccess,
  cacheReady,
  cacheRefreshDuration,
} from "../metrics.js";

export class PoolCache {
  private pools: Pool[] = [];
  private updatedAt = 0;
  private refreshing = false;
  private readonly ttlMs: number;
  private readonly fetcher: () => Promise<Pool[]>;

  constructor(ttlMs: number, fetcher: () => Promise<Pool[]>) {
    this.ttlMs = ttlMs;
    this.fetcher = fetcher;
  }

  /** Returns cached pools, refreshing if stale. */
  async get(): Promise<Pool[]> {
    if (this.isStale()) {
      await this.refresh();
    }
    return this.pools;
  }

  /** True if at least one successful fetch has occurred. */
  get ready(): boolean {
    return this.updatedAt > 0;
  }

  /** Starts periodic background refresh. */
  startBackgroundRefresh(): void {
    this.refresh().catch((err) =>
      console.error("Initial cache refresh failed:", err)
    );

    setInterval(() => {
      this.refresh().catch((err) =>
        console.error("Background cache refresh failed:", err)
      );
    }, this.ttlMs);
  }

  private isStale(): boolean {
    return Date.now() - this.updatedAt > this.ttlMs;
  }

  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    const start = process.hrtime.bigint();

    try {
      this.pools = await this.fetcher();
      this.updatedAt = Date.now();
      cacheReady.set(1);
      cacheLastSuccess.set(this.updatedAt / 1000);
      cacheRefreshDuration.observe(
        { outcome: "success" },
        Number(process.hrtime.bigint() - start) / 1_000_000_000
      );
      console.log(`Cache refreshed: ${this.pools.length} pools`);
    } catch (error) {
      cacheReady.set(this.updatedAt > 0 ? 1 : 0);
      cacheRefreshDuration.observe(
        { outcome: "error" },
        Number(process.hrtime.bigint() - start) / 1_000_000_000
      );
      throw error;
    } finally {
      this.refreshing = false;
    }
  }
}
