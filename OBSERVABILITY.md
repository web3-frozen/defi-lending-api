# Observability

The API exposes Prometheus metrics at `GET /metrics`.

## Questions this service answers

- Which HTTP route has slow p95/p99 latency?
- Which DeFiLlama endpoint is slow or failing?
- Is the lending-pool cache fresh and healthy?

## Metrics

| Metric | Labels | Purpose |
|--------|--------|---------|
| `defi_lending_http_requests_total` | `method`, `route`, `status_class` | Request rate and error rate |
| `defi_lending_http_request_duration_seconds` | `method`, `route` | HTTP latency histogram |
| `defi_lending_external_requests_total` | `provider`, `operation`, `outcome` | Upstream request rate and errors |
| `defi_lending_external_request_duration_seconds` | `provider`, `operation`, `outcome` | Upstream latency histogram |
| `defi_lending_cache_refresh_duration_seconds` | `outcome` | Cache refresh latency |
| `defi_lending_cache_ready` | none | Whether a successful snapshot exists |
| `defi_lending_cache_last_success_timestamp_seconds` | none | Unix timestamp of the last successful refresh |

The route and provider labels use fixed, low-cardinality values. Request IDs,
URLs, user IDs, and error text belong in logs and traces, not metrics.
