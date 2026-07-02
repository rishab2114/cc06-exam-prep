'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatSgd } from '../../../lib/format';
import { SponsoredCard } from '../../../components/Sponsored';
import { adFor } from '../../../lib/ads';
import { useStore } from '../../../lib/store';

// Marketplace / Explore — the live campus feed. Filters map to how students
// actually choose: category, trust flags (verified / contactless / customer
// present / same-gender) and sorting. Client-side over the fetched feed; the
// same params become API query params once volume needs server paging.

const SORTS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'cheapest', label: 'Cheapest' },
  { key: 'rating', label: 'Top rated' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
        active
          ? 'border-blue-600 bg-blue-600 font-medium text-white'
          : 'border-slate-300 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

export default function FindPage() {
  const { feed } = useStore();
  const [category, setCategory] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [contactlessOnly, setContactlessOnly] = useState(false);
  const [presentOnly, setPresentOnly] = useState(false);
  const [sameGenderOnly, setSameGenderOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('nearest');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(feed.map((t) => t.category)))],
    [feed],
  );

  const tasks = useMemo(() => {
    const filtered = feed.filter(
      (t) =>
        (category === 'All' || t.category === category) &&
        (!verifiedOnly || t.requiresMatricVerification) &&
        (!contactlessOnly || t.contactless) &&
        (!presentOnly || t.presenceRequired) &&
        (!sameGenderOnly || t.sameGenderOnly),
    );
    return [...filtered].sort((a, b) =>
      sort === 'nearest'
        ? a.distanceKm - b.distanceKm
        : sort === 'cheapest'
          ? a.priceCents - b.priceCents
          : b.customerRating - a.customerRating,
    );
  }, [feed, category, verifiedOnly, contactlessOnly, presentOnly, sameGenderOnly, sort]);

  function clearFilters() {
    setCategory('All');
    setVerifiedOnly(false);
    setContactlessOnly(false);
    setPresentOnly(false);
    setSameGenderOnly(false);
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">
          Explore <span className="text-green-500">●</span>
        </span>
        <label className="text-sm text-slate-500">
          Sort:{' '}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </header>

      {/* Filters: categories, then trust toggles */}
      <div className="space-y-2 border-b bg-white px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)}>
            🪪 Verified
          </FilterChip>
          <FilterChip active={contactlessOnly} onClick={() => setContactlessOnly(!contactlessOnly)}>
            📦 Contactless
          </FilterChip>
          <FilterChip active={presentOnly} onClick={() => setPresentOnly(!presentOnly)}>
            👥 Customer present
          </FilterChip>
          <FilterChip active={sameGenderOnly} onClick={() => setSameGenderOnly(!sameGenderOnly)}>
            ♀♂ Same-gender
          </FilterChip>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
          {(category !== 'All' || verifiedOnly || contactlessOnly || presentOnly || sameGenderOnly) && (
            <button onClick={clearFilters} className="text-blue-700">Clear filters</button>
          )}
        </div>

        <SponsoredCard ad={adFor(2)} />

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            No tasks match these filters.
            <button onClick={clearFilters} className="mt-2 block w-full font-medium text-blue-700">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex flex-col rounded-xl border bg-white p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{t.icon} {t.title}</span>
                  <span className="shrink-0 text-green-700">
                    {formatSgd(t.priceCents)}{t.study ? '/hr' : ''}
                  </span>
                </div>
                {t.study ? (
                  <div className="mt-1 text-sm text-slate-500">
                    <p>📖 {t.study.topics.join(' · ')}</p>
                    <p className="text-xs">
                      {t.study.level} · goal: {t.study.goal} · {t.study.format} · {t.when}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    {t.hall} · {t.when} · {t.distanceKm}km · cust ⭐{t.customerRating}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {t.study?.helpTypes.map((h) => (
                    <span key={h} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{h}</span>
                  ))}
                  {t.category === 'Study help' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">📚 tutoring only</span>
                  )}
                  {t.requiresMatricVerification && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">🪪 ID-verified</span>
                  )}
                  {t.sameGenderOnly && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                      {t.customerGender === 'F' ? '♀ female buddies' : '♂ male buddies'}
                    </span>
                  )}
                  {t.presenceRequired && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">👥 customer present</span>
                  )}
                  {t.contactless && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">📦 contactless</span>
                  )}
                </div>
                <div className="mt-auto pt-2">
                  {t.isMine ? (
                    <Link
                      href={`/app/applicants/${t.id}`}
                      className="block rounded-lg border border-blue-600 py-2 text-center text-sm font-medium text-blue-700"
                    >
                      Your post — {t.offerCount} offer{t.offerCount === 1 ? '' : 's'}
                    </Link>
                  ) : (
                    <Link
                      href={`/app/apply/${t.id}`}
                      className="block rounded-lg bg-blue-700 py-2 text-center text-sm font-medium text-white"
                    >
                      Offer to help{t.offerCount > 0 ? ` · ${t.offerCount} offer${t.offerCount === 1 ? '' : 's'} in` : ''}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
