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
  { key: 'recent', label: 'Recent' },
  { key: 'cheapest', label: 'Cheapest' },
  { key: 'priciest', label: 'Highest pay' },
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
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(feed.map((t) => t.category)))],
    [feed],
  );

  const q = query.trim().toLowerCase();
  const tasks = useMemo(() => {
    // Search matches what a student would type: title, details, module/topics,
    // poster, and location. Client-side over the fetched feed (≤100 tasks) —
    // instant as-you-type; server FTS takes over at real volume.
    const matches = (t: (typeof feed)[number]) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.study ? `${t.study.module} ${t.study.topics.join(' ')}`.toLowerCase().includes(q) : false) ||
      t.customerName.toLowerCase().includes(q) ||
      t.hall.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const filtered = feed.filter(
      (t) =>
        matches(t) &&
        (category === 'All' || t.category === category) &&
        (!verifiedOnly || t.requiresMatricVerification) &&
        (!contactlessOnly || t.contactless) &&
        (!presentOnly || t.presenceRequired),
    );
    // feed arrives newest-first from the API, so 'recent' keeps that order.
    if (sort === 'cheapest') return [...filtered].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === 'priciest') return [...filtered].sort((a, b) => b.priceCents - a.priceCents);
    return filtered;
  }, [feed, q, category, verifiedOnly, contactlessOnly, presentOnly, sort]);

  function clearFilters() {
    setQuery('');
    setCategory('All');
    setVerifiedOnly(false);
    setContactlessOnly(false);
    setPresentOnly(false);
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">
          Explore <span className="text-green-500">●</span>
        </span>
        {/* Sort — mobile only; on desktop it lives in the filter rail */}
        <label className="text-sm text-slate-500 lg:hidden">
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

      {/* Search — the fastest path to the right task */}
      <div className="border-b bg-white px-4 py-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks — laundry, MH1810, parcel…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
            aria-label="Search tasks"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mobile filters: horizontal chip scrollers */}
      <div className="space-y-2 border-b bg-white px-4 py-3 lg:hidden">
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
        </div>
      </div>

      {/* Desktop: sticky filter rail + wide grid */}
      <div className="lg:flex lg:gap-6 lg:p-4">
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-4 space-y-5 rounded-2xl border bg-white p-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Category</p>
              <div className="space-y-0.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                      category === c ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Trust &amp; safety</p>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly(!verifiedOnly)} /> 🪪 Verified
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={contactlessOnly} onChange={() => setContactlessOnly(!contactlessOnly)} /> 📦 Contactless
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentOnly} onChange={() => setPresentOnly(!presentOnly)} /> 👥 Customer present
                </label>
              </div>
            </div>
            {(q !== '' || category !== 'All' || verifiedOnly || contactlessOnly || presentOnly) && (
              <button onClick={clearFilters} className="text-sm font-medium text-blue-700">Clear all filters</button>
            )}
          </div>
        </aside>

        <div className="flex-1 space-y-3 p-4 lg:p-0">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
            {(category !== 'All' || verifiedOnly || contactlessOnly || presentOnly) && (
              <button onClick={clearFilters} className="text-blue-700 lg:hidden">Clear filters</button>
            )}
          </div>

          <SponsoredCard ad={adFor(2)} />

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            {q ? <>No tasks match “{query.trim()}”.</> : <>No tasks match these filters.</>}
            <button onClick={clearFilters} className="mt-2 block w-full font-medium text-blue-700">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    {t.hall} · {t.when} · by {t.customerName}
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
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">🪪 verify on arrival</span>
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
    </div>
  );
}
