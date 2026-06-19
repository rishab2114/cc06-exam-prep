/** Display helpers. Money is integer SGD cents end-to-end (matches the backend). */

export function formatSgd(cents: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(
    cents / 100,
  );
}

/**
 * Progressive commission (marginal brackets), capped well below the old flat 15%.
 * Bigger jobs are charged a higher marginal rate, so the effective rate scales
 * from ~1% on small tasks up toward ~5% on large ones — never more.
 *   portion up to S$10  -> 1%
 *   portion S$10–S$30   -> 3%
 *   portion above S$30  -> 5%
 * Keep this in sync with the backend fee service.
 */
function progressiveFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  const b1 = Math.min(amountCents, 1000); // up to S$10
  const b2 = Math.min(Math.max(amountCents - 1000, 0), 2000); // S$10–30
  const b3 = Math.max(amountCents - 3000, 0); // above S$30
  return Math.round(b1 * 0.01 + b2 * 0.03 + b3 * 0.05);
}

/** Fee breakdown for a task amount. platformFee is computed but not shown to users. */
export function feeBreakdown(amountCents: number) {
  const fee = progressiveFeeCents(amountCents);
  return { youPay: amountCents, platformFee: fee, buddyGets: amountCents - fee };
}
