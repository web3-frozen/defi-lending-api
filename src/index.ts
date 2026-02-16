import express from "express";
import { PoolCache, fetchLendingPools } from "./services/index.js";
import { createPoolRouter, createHealthRouter } from "./routes/index.js";
import { requestLogger, cors } from "./middleware/index.js";

const PORT = Number(process.env.PORT) || 8080;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new PoolCache(CACHE_TTL_MS, fetchLendingPools);
cache.startBackgroundRefresh();

const app = express();

app.use(cors);
app.use(requestLogger);
app.use(createHealthRouter(cache));
app.use("/api", createPoolRouter(cache));

app.listen(PORT, () => {
  console.log(`DeFi Lending API listening on :${PORT}`);
});

export { app };
