// Synthetic sponsored inventory for the advertising-surface demo (see docs/13).
// Real ads would need partner approval, an ad server and PDPA-aware consent.
export interface Ad {
  id: string;
  brand: string;
  emoji: string;
  title: string;
  blurb: string;
}

export const ADS: Ad[] = [
  { id: 'ad-cafe', brand: 'North Spine Café · sample', emoji: '🧋', title: 'Student drink promotion could appear here', blurb: 'Illustrative partner card' },
  { id: 'ad-bank', brand: 'Campus Bank · sample', emoji: '🏦', title: 'A student account campaign could fit here', blurb: 'Illustrative partner card' },
  { id: 'ad-laundry', brand: 'Hall Laundromat · sample', emoji: '🧼', title: 'A laundry discount could appear here', blurb: 'Illustrative partner card' },
];

/** Pick an ad deterministically (so SSR/CSR match). */
export function adFor(seed = 0): Ad {
  return ADS[((seed % ADS.length) + ADS.length) % ADS.length];
}
