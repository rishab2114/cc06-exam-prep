import { ADS, type Ad } from '../lib/ads';

// Clearly-labelled sample inventory for the planned ad surface (docs/13). These
// cards are deliberately non-interactive so a product demo never implies a real
// commercial promotion, click-through or brand relationship.
export function SponsoredCard({ ad = ADS[0] }: { ad?: Ad }) {
  return (
    <div aria-label="Sample sponsored placement" className="rounded-xl border border-dashed border-border-strong bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
          Sample sponsored placement
        </span>
        <span className="text-xs text-subtle">{ad.brand}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="text-2xl">{ad.emoji}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{ad.title}</p>
          <p className="text-xs text-muted">{ad.blurb}</p>
        </div>
        <span className="rounded-lg bg-surface-sunken px-3 py-1.5 text-xs font-medium text-subtle">
          Demo only
        </span>
      </div>
    </div>
  );
}
