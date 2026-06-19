/**
 * Single source of truth for money math. All amounts are integer SGD cents.
 * Commission is PROGRESSIVE (marginal brackets), capped well below the old flat
 * 15%: bigger jobs pay a higher marginal rate so the effective rate scales from
 * ~1% on small tasks up toward ~5% on large ones. Brackets are configurable via
 * env (see docs/10 and docs/13). Never do fee math anywhere else.
 *
 *   portion up to S$10  -> 1%
 *   portion S$10–S$30   -> 3%
 *   portion above S$30  -> 5%
 */

const BRACKET_1_CENTS = Number(process.env.FEE_BRACKET_1_CENTS ?? 1000); // S$10
const BRACKET_2_CENTS = Number(process.env.FEE_BRACKET_2_CENTS ?? 3000); // S$30
const RATE_1_BPS = Number(process.env.FEE_RATE_1_BPS ?? 100); // 1%
const RATE_2_BPS = Number(process.env.FEE_RATE_2_BPS ?? 300); // 3%
const RATE_3_BPS = Number(process.env.FEE_RATE_3_BPS ?? 500); // 5%
const MIN_TASK_CENTS = Number(process.env.MIN_TASK_CENTS ?? 0); // no minimum

/** Progressive platform fee for a given gross amount. */
export function platformFee(amountCents: number): number {
  if (amountCents <= 0) return 0;
  const b1 = Math.min(amountCents, BRACKET_1_CENTS);
  const b2 = Math.min(Math.max(amountCents - BRACKET_1_CENTS, 0), BRACKET_2_CENTS - BRACKET_1_CENTS);
  const b3 = Math.max(amountCents - BRACKET_2_CENTS, 0);
  return Math.round((b1 * RATE_1_BPS + b2 * RATE_2_BPS + b3 * RATE_3_BPS) / 10000);
}

/** What the provider nets after the platform fee. */
export function providerNet(amountCents: number): number {
  return amountCents - platformFee(amountCents);
}

/** Validate a task budget. No minimum by default — any positive integer is allowed. */
export function isValidTaskAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents > 0 && amountCents >= MIN_TASK_CENTS;
}

/** Format cents as a SGD string for display/logging, e.g. 1700 -> "S$17.00". */
export function formatSgd(amountCents: number): string {
  return `S$${(amountCents / 100).toFixed(2)}`;
}

export const MONEY_CONFIG = {
  BRACKET_1_CENTS,
  BRACKET_2_CENTS,
  RATE_1_BPS,
  RATE_2_BPS,
  RATE_3_BPS,
  MIN_TASK_CENTS,
};
