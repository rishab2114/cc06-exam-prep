// Mock sponsored inventory — the advertising surface (see docs/13). Real ads come
// from an ad server, targeted on verified-student attributes (campus, year, school)
// under PDPA consent. Always rendered clearly labelled "Sponsored".
export interface Ad {
  id: string;
  brand: string;
  emoji: string;
  title: string;
  blurb: string;
  cta: string;
}

export const ADS: Ad[] = [
  { id: 'ad-koufu', brand: 'Koufu · North Spine', emoji: '🧋', title: '1-for-1 bubble tea till 6pm', blurb: 'Verified students only', cta: 'Get deal' },
  { id: 'ad-dbs', brand: 'DBS', emoji: '🏦', title: 'S$20 free with a student account', blurb: 'Open in 5 min · no fees', cta: 'Learn more' },
  { id: 'ad-cleanpro', brand: 'CleanPro Laundromat', emoji: '🧼', title: '10% off wash & fold', blurb: 'Near campus · students only', cta: 'View offer' },
];

/** Pick an ad deterministically (so SSR/CSR match). */
export function adFor(seed = 0): Ad {
  return ADS[((seed % ADS.length) + ADS.length) % ADS.length];
}
