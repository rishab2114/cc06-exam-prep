/** Display helpers. Money is integer SGD cents end-to-end (matches the backend). */

export function formatSgd(cents: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(
    cents / 100,
  );
}

const PLATFORM_FEE_BPS = 1500;
const MIN_FEE_CENTS = 100;

/** Mirror of backend fee math for the live "you pay X / buddy gets Y" breakdown. */
export function feeBreakdown(amountCents: number) {
  const fee = Math.max(Math.round((amountCents * PLATFORM_FEE_BPS) / 10000), MIN_FEE_CENTS);
  return { youPay: amountCents, platformFee: fee, buddyGets: amountCents - fee };
}
