# DeFi Lending API

Lending markets from DeFiLlama. The API joins `https://yields.llama.fi/pools` with `https://yields.llama.fi/lendBorrow` and keeps every chain in that join. There is no chain whitelist.

Live site: https://lending.dummysui.monster/

## Rates

Sorting and filters use the total, not the base rate alone.

| Side | Total | Meaning |
| --- | --- | --- |
| Supply | `apyBase + apyReward` | Reward is extra yield |
| Borrow | `apyBaseBorrow - apyRewardBorrow` | Reward is paid to the borrower, so it reduces the cost |

If DeFiLlama reports only a headline APY, `apyBase` and `apyReward` stay null. Do not invent `0 + 0`.

## HTTP

| Method | Path | Description |
| --- | --- | --- |
| GET | `/healthz` | Liveness |
| GET | `/readyz` | Ready after the first successful cache fill |
| GET | `/api/pools` | Filtered lending pools |
| GET | `/api/chains` | Chains present in the cache |
| GET | `/api/symbols` | Asset symbols and pool counts |
| GET | `/api/protocols` | Protocols and TVL |
| GET | `/metrics` | Prometheus metrics |

`/api/pools` query parameters:

| Param | Values | Notes |
| --- | --- | --- |
| `chain` | lowercase chain key | For example `ethereum`, `op mainnet` |
| `symbol` | ticker substring | `usdc` matches `USDC` |
| `stablecoin` | `true` or `false` | Omit for both |
| `project` | protocol slug | |
| `minTvl` | USD number | Applied before the row limit |
| `sort` | `tvl`, `apy`, `apyBorrow`, `ltv` | Default `tvl` |
| `order` | `asc` or `desc` | Default `desc` |
| `limit` | 1–200 | Default 50 |

`totalCount` is the match count before `limit`.

The cache refreshes every 5 minutes.

## CI and deploy

Pushes to `main` call `web3-frozen/homelab-apps/.github/workflows/ci-container.yaml`. The job label is `homelab-defi-lending-api`.

That label is the Argo CD Application `arc-private-defi-lending-api`. It installs an Actions Runner Controller scale set in `actions-runner-system`. A queued job that says `Waiting for a runner` and then `Job is about to start running on the runner: homelab-defi-lending-api` is that scale set, not a GitHub-hosted runner. The scale set is ephemeral (`minRunners: 0`), so the wait is the pod starting.

Do not add `ubuntu-latest` jobs. The GitHub-hosted minute quota is exhausted.

Image builds use the pod-local BuildKit sidecar at `tcp://127.0.0.1:1234`. Do not put `# syntax=docker/dockerfile:1` back in the Dockerfile. That frontend crashes this rootless sidecar.

After the image scan passes, CI opens and squash-merges a pull request in `web3-frozen/homelab-apps` that sets `workloads/defi-lending/kustomization.yaml`. Argo CD then rolls `defi-lending-api`.
