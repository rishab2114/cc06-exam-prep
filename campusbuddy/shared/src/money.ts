/**
 * Money math — THE single copy. All amounts are integer SGD cents.
 * Frontend and backend both import from here; the old duplicate copies
 * (frontend/lib/format.ts, backend money.ts) are now thin re-exports.
 *
 * Commission is progressive (marginal brackets): 1% up to S$10, 3% to S$30,
 * 5% above — configurable via FeeConfig (backend binds env values).
 */
export interface FeeConfig {
  bracket1Cents: number; // upper bound of bracket 1
  bracket2Cents: number; // upper bound of bracket 2
  rate1Bps: number;
  rate2Bps: number;
  rate3Bps: number;
  minTaskCents: number; // 0 = no minimum
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  bracket1Cents: 1000,
  bracket2Cents: 3000,
  rate1Bps: 100,
  rate2Bps: 300,
  rate3Bps: 500,
  minTaskCents: 0,
};

/** Progressive platform fee for a gross amount. */
export function platformFee(amountCents: number, cfg: FeeConfig = DEFAULT_FEE_CONFIG): number {
  if (amountCents <= 0) return 0;
  const b1 = Math.min(amountCents, cfg.bracket1Cents);
  const b2 = Math.min(Math.max(amountCents - cfg.bracket1Cents, 0), cfg.bracket2Cents - cfg.bracket1Cents);
  const b3 = Math.max(amountCents - cfg.bracket2Cents, 0);
  return Math.round((b1 * cfg.rate1Bps + b2 * cfg.rate2Bps + b3 * cfg.rate3Bps) / 10000);
}

/** What the provider nets after the platform fee. */
export function providerNet(amountCents: number, cfg: FeeConfig = DEFAULT_FEE_CONFIG): number {
  return amountCents - platformFee(amountCents, cfg);
}

/** Fee breakdown for display. platformFee is computed but not shown to users. */
export function feeBreakdown(amountCents: number, cfg: FeeConfig = DEFAULT_FEE_CONFIG) {
  const fee = platformFee(amountCents, cfg);
  return { youPay: amountCents, platformFee: fee, buddyGets: amountCents - fee };
}

/** Validate a task budget. Any positive integer unless a minimum is configured. */
export function isValidTaskAmount(amountCents: number, cfg: FeeConfig = DEFAULT_FEE_CONFIG): boolean {
  return Number.isInteger(amountCents) && amountCents > 0 && amountCents >= cfg.minTaskCents;
}

/** Format cents as an SGD string, e.g. 1700 -> "S$17.00". */
export function formatSgd(amountCents: number): string {
  return `S$${(amountCents / 100).toFixed(2)}`;
}

/** Parse a user-typed SGD amount safely. Integer cents, clamped to [0, S$999]. */
export function parseSgdToCents(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n * 100), 99900);
}
