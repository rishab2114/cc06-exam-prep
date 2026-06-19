/**
 * Single source of truth for money math. All amounts are integer SGD cents.
 * The 15% platform fee, fee floor, and minimum task value are configurable via env
 * (see docs/10 and docs/13). Never do fee math anywhere else.
 */

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 1500); // 15.00%
const MIN_PLATFORM_FEE_CENTS = Number(process.env.MIN_PLATFORM_FEE_CENTS ?? 100); // S$1.00 floor
const MIN_TASK_CENTS = Number(process.env.MIN_TASK_CENTS ?? 500); // S$5.00 minimum

/** Platform fee for a given gross amount, with a floor so tiny tasks aren't margin-negative. */
export function platformFee(amountCents: number): number {
  const pct = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
  return Math.max(pct, MIN_PLATFORM_FEE_CENTS);
}

/** What the provider nets after the platform fee. */
export function providerNet(amountCents: number): number {
  return amountCents - platformFee(amountCents);
}

/** Validate a task budget meets the minimum value rule. */
export function isValidTaskAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents >= MIN_TASK_CENTS;
}

/** Format cents as a SGD string for display/logging, e.g. 1700 -> "S$17.00". */
export function formatSgd(amountCents: number): string {
  return `S$${(amountCents / 100).toFixed(2)}`;
}

export const MONEY_CONFIG = { PLATFORM_FEE_BPS, MIN_PLATFORM_FEE_CENTS, MIN_TASK_CENTS };
