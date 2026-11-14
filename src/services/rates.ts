export interface RateParts {
  base: number | null;
  reward: number | null;
  total: number;
}

/** Supply total is base + reward when either part is reported. */
export function supplyRate(
  apy: number | null,
  apyBase: number | null,
  apyReward: number | null
): RateParts {
  if (apyBase == null && apyReward == null) {
    return { base: null, reward: null, total: apy ?? 0 };
  }
  const base = apyBase ?? 0;
  const reward = apyReward ?? 0;
  return { base, reward, total: base + reward };
}

/**
 * Borrow rewards are paid to the borrower, so they reduce the cost.
 * Net = interest - reward.
 */
export function borrowRate(
  apyBaseBorrow: number | null,
  apyRewardBorrow: number | null
): RateParts {
  if (apyBaseBorrow == null && apyRewardBorrow == null) {
    return { base: null, reward: null, total: 0 };
  }
  const base = apyBaseBorrow ?? 0;
  const reward = apyRewardBorrow ?? 0;
  return { base, reward, total: base - reward };
}
