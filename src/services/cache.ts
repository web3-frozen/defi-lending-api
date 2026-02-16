import type { Pool } from "../types/index.js";

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

    try {
      this.pools = await this.fetcher();
      this.updatedAt = Date.now();
      console.log(`Cache refreshed: ${this.pools.length} pools`);
    } finally {
      this.refreshing = false;
    }
  }
}
