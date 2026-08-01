import { ADS, type Ad } from '../lib/ads';

// Clearly-labelled sponsored card — the in-app ad surface (docs/13). Trust is the
// product, so ads are always marked "Sponsored" and visually distinct.
export function SponsoredCard({ ad = ADS[0] }: { ad?: Ad }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
          Sponsored
        </span>
        <span className="text-xs text-subtle">{ad.brand}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="text-2xl">{ad.emoji}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{ad.title}</p>
          <p className="text-xs text-muted">{ad.blurb}</p>
        </div>
        <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
          {ad.cta}
        </button>
      </div>
    </div>
  );
}
