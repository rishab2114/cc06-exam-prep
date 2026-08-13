'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { WelcomeCard } from '../../../components/WelcomeCard';
import { formatSgd } from '../../../lib/format';
import { SponsoredCard } from '../../../components/Sponsored';
import { adFor } from '../../../lib/ads';
import { useStore } from '../../../lib/store';
import { CategoryIcon } from '../../../components/CategoryIcon';
import { Bookmark, BookOpen, Search as SearchIcon, X } from 'lucide-react';
import {
  facetsFor,
  facetValues,
  facetMatches,
  facetNeedsInput,
  courseCodeOf,
} from '../../../lib/facets';

// Marketplace / Explore — the live campus feed. Filters map to how students
// actually choose: category, safety flags (verification-on-arrival / contactless / customer
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
          ? 'border-brand bg-brand font-medium text-white'
          : 'border-border-strong bg-surface text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function FindPageInner() {
  const params = useSearchParams();
  const forceWelcome = params.get('welcome') === '1';
  const { hydrating, feed, savedIds, toggleSave, feedHasMore, loadMoreFeed } = useStore();
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreFeed();
    } finally {
      setLoadingMore(false);
    }
  }
  const [category, setCategory] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [contactlessOnly, setContactlessOnly] = useState(false);
  const [presentOnly, setPresentOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');
  // facet key -> chosen value. Reset whenever the category changes, since a
  // course filter makes no sense once you've switched to Laundry.
  const [facetSel, setFacetSel] = useState<Record<string, string>>({});

  function chooseCategory(next: string) {
    setCategory(next);
    setFacetSel({});
  }
  // A chip and the text box drive the same value — clicking a chip just fills
  // the box with an exact value; clicking the active one clears it.
  function toggleFacet(key: string, value: string) {
    setFacetSel((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  }
  function setFacetText(key: string, value: string) {
    setFacetSel((prev) => ({ ...prev, [key]: value }));
  }

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(feed.map((t) => t.category)))],
    [feed],
  );

  const q = query.trim().toLowerCase();

  // Tasks in the chosen category, before facets apply — this is what the facet
  // options and their counts are built from, so a filter never offers a value
  // that would return nothing.
  const inCategory = useMemo(
    () => (category === 'All' ? [] : feed.filter((t) => t.category === category)),
    [feed, category],
  );

  const tasks = useMemo(() => {
    // Search matches what a student would type: title, details, module/topics,
    // poster, and location. Client-side over the fetched feed (≤100 tasks) —
    // instant as-you-type; server FTS takes over at real volume.
    const matches = (t: (typeof feed)[number]) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.study
        ? `${t.study.module} ${t.study.topics.join(' ')} ${courseCodeOf(t.study.module) ?? ''}`
            .toLowerCase()
            .includes(q)
        : false) ||
      t.customerName.toLowerCase().includes(q) ||
      t.hall.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const activeFacets = facetsFor(category).filter((f) => facetSel[f.key]?.trim());
    const filtered = feed.filter(
      (t) =>
        matches(t) &&
        (category === 'All' || t.category === category) &&
        activeFacets.every((f) => facetMatches(f.valueOf(t), facetSel[f.key])) &&
        (!verifiedOnly || t.requiresMatricVerification) &&
        (!contactlessOnly || t.contactless) &&
        (!presentOnly || t.presenceRequired),
    );
    // feed arrives newest-first from the API, so 'recent' keeps that order.
    if (sort === 'cheapest') return [...filtered].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === 'priciest') return [...filtered].sort((a, b) => b.priceCents - a.priceCents);
    return filtered;
  }, [feed, q, category, facetSel, verifiedOnly, contactlessOnly, presentOnly, sort]);

  function clearFilters() {
    setQuery('');
    setCategory('All');
    setFacetSel({});
    setVerifiedOnly(false);
    setContactlessOnly(false);
    setPresentOnly(false);
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <span className="font-semibold">
          Explore
          <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            demo data
          </span>
        </span>
        {/* Sort — mobile only; on desktop it lives in the filter rail */}
        <label className="text-sm text-muted lg:hidden">
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
      <div className="border-b border-border bg-surface px-4 py-2.5">
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks — laundry, MH1810, parcel…"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface-sunken pl-9 pr-3 text-sm transition-colors duration-150 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-ring/30"
            aria-label="Search tasks"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-subtle hover:text-muted"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 lg:px-4">
        <WelcomeCard forceShow={forceWelcome} />
      </div>

      {/* Mobile filters: horizontal chip scrollers */}
      <div className="space-y-2 border-b bg-surface px-4 py-3 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => chooseCategory(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
        {/* Facets for the chosen category (e.g. Course when you pick Study help) */}
        {facetsFor(category).map((f) => {
          const values = facetValues(inCategory, f);
          if (values.length < 2) return null;
          const typed = facetSel[f.key] ?? '';
          const shown = values.filter((v) => facetMatches(v.value, typed));
          return (
            <div key={f.key} className="space-y-2">
              {facetNeedsInput(f, values.length) && (
                <div className="relative">
                  <input
                    value={typed}
                    onChange={(e) => setFacetText(f.key, e.target.value)}
                    placeholder={f.key === 'course' ? 'Type a course, e.g. MH1810' : `Type a ${f.label.toLowerCase()}`}
                    aria-label={`Filter by ${f.label.toLowerCase()}`}
                    className="min-h-[40px] w-full rounded-lg border border-border-strong bg-surface px-3 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring/30"
                  />
                  {typed && (
                    <button
                      onClick={() => setFacetText(f.key, '')}
                      aria-label={`Clear ${f.label.toLowerCase()} filter`}
                      className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <span className="shrink-0 self-center text-xs font-semibold uppercase tracking-wide text-subtle">
                  {f.label}
                </span>
                {shown.map((v) => (
                  <FilterChip key={v.value} active={typed === v.value} onClick={() => toggleFacet(f.key, v.value)}>
                    {v.value} <span className="opacity-60">{v.count}</span>
                  </FilterChip>
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)}>
            Verify on arrival
          </FilterChip>
          <FilterChip active={contactlessOnly} onClick={() => setContactlessOnly(!contactlessOnly)}>
            Contactless
          </FilterChip>
          <FilterChip active={presentOnly} onClick={() => setPresentOnly(!presentOnly)}>
            Customer present
          </FilterChip>
        </div>
      </div>

      {/* Desktop: sticky filter rail + wide grid */}
      <div className="lg:flex lg:gap-6 lg:p-4">
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-4 space-y-5 rounded-2xl border bg-surface p-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Sort</p>
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
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Category</p>
              <div className="space-y-0.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => chooseCategory(c)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                      category === c ? 'bg-brand-soft font-medium text-brand' : 'text-muted hover:bg-surface-sunken'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {facetsFor(category).map((f) => {
              const values = facetValues(inCategory, f);
              if (values.length < 2) return null;
              const typed = facetSel[f.key] ?? '';
              // Typing narrows the chips as well as the results, so a long
              // course list stays usable.
              const shown = values.filter((v) => facetMatches(v.value, typed));
              return (
                <div key={f.key}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">{f.label}</p>
                  {facetNeedsInput(f, values.length) && (
                    <div className="relative mb-2">
                      <input
                        value={typed}
                        onChange={(e) => setFacetText(f.key, e.target.value)}
                        placeholder={f.key === 'course' ? 'Type a course, e.g. MH1810' : `Type a ${f.label.toLowerCase()}`}
                        aria-label={`Filter by ${f.label.toLowerCase()}`}
                        className="min-h-[38px] w-full rounded-lg border border-border-strong bg-surface px-3 pr-8 text-sm transition-colors duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring/30"
                      />
                      {typed && (
                        <button
                          onClick={() => setFacetText(f.key, '')}
                          aria-label={`Clear ${f.label.toLowerCase()} filter`}
                          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:text-text"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {shown.length === 0 && (
                      <span className="text-xs text-subtle">No {f.label.toLowerCase()} matches “{typed}”.</span>
                    )}
                    {shown.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => toggleFacet(f.key, v.value)}
                        aria-pressed={typed === v.value}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                          typed === v.value
                            ? 'border-brand bg-brand font-medium text-white'
                            : 'border-border-strong bg-surface text-muted hover:border-brand/50'
                        }`}
                      >
                        {v.value} <span className="opacity-60">{v.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Trust &amp; safety</p>
              <div className="space-y-2 text-sm text-muted">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly(!verifiedOnly)} /> Verify on arrival
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={contactlessOnly} onChange={() => setContactlessOnly(!contactlessOnly)} /> Contactless
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentOnly} onChange={() => setPresentOnly(!presentOnly)} /> Customer present
                </label>
              </div>
            </div>
            {(q !== '' || category !== 'All' || verifiedOnly || contactlessOnly || presentOnly) && (
              <button onClick={clearFilters} className="text-sm font-medium text-brand">Clear all filters</button>
            )}
          </div>
        </aside>

        <div className="flex-1 space-y-3 p-4 lg:p-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{hydrating ? 'Loading sample tasks…' : `${tasks.length} task${tasks.length === 1 ? '' : 's'}`}</span>
            {(category !== 'All' || verifiedOnly || contactlessOnly || presentOnly) && (
              <button onClick={clearFilters} className="text-brand lg:hidden">Clear filters</button>
            )}
          </div>

          <SponsoredCard ad={adFor(2)} />

        {hydrating ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading tasks">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card animate-pulse p-3.5 shadow-card" aria-hidden="true">
                <div className="h-4 w-3/4 rounded bg-surface-sunken" />
                <div className="mt-3 h-3 w-1/2 rounded bg-surface-sunken" />
                <div className="mt-6 h-10 rounded-xl bg-surface-sunken" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
            {q ? <>No tasks match “{query.trim()}”.</> : <>No tasks match these filters.</>}
            <button onClick={clearFilters} className="mt-2 block w-full font-medium text-brand">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((t) => (
              <div key={t.id} className="card relative flex flex-col p-3.5 shadow-card transition-shadow duration-150 hover:shadow-lift">
                {!t.isMine && (
                  <button
                    onClick={() => void toggleSave(t.id)}
                    aria-label={savedIds.has(t.id) ? 'Remove bookmark' : 'Save task'}
                    aria-pressed={savedIds.has(t.id)}
                    className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 ${savedIds.has(t.id) ? 'text-accent' : 'text-subtle hover:text-text'}`}
                  >
                    <Bookmark size={17} fill={savedIds.has(t.id) ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                )}
                <div className="flex items-start gap-2.5 pr-9">
                  <CategoryIcon category={t.category} emoji={t.icon} size="sm" />
                  <span className="min-w-0 flex-1 font-medium leading-snug">{t.title}</span>
                </div>
                {t.study ? (
                  <div className="mt-1 text-sm text-muted">
                    <p className="flex items-center gap-1.5"><BookOpen size={13} className="shrink-0 text-brand" aria-hidden="true" />{t.study.topics.join(' · ')}</p>
                    <p className="text-xs">
                      {t.study.level} · goal: {t.study.goal} · {t.study.format} · {t.when}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    {t.hall} · {t.when} · by {t.customerName}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {t.study?.helpTypes.map((h) => (
                    <span key={h} className="badge bg-brand-soft text-brand">{h}</span>
                  ))}
                  {t.category === 'Study help' && (
                    <span className="badge bg-accent-soft text-accent-text">tutoring only</span>
                  )}
                  {t.requiresMatricVerification && (
                    <span className="badge bg-accent-soft text-accent-text">verify on arrival</span>
                  )}
                  {t.presenceRequired && (
                    <span className="badge bg-brand-soft text-brand">customer present</span>
                  )}
                  {t.contactless && (
                    <span className="badge bg-surface-sunken text-muted">contactless</span>
                  )}
                </div>
                <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
                  <span className="text-lg font-semibold text-success">
                    {formatSgd(t.priceCents)}
                    {t.study ? <span className="text-xs font-medium text-muted">/hr</span> : null}
                  </span>
                </div>
                <div className="pt-2">
                  {t.isMine ? (
                    <Link
                      href={`/app/applicants/${t.id}`}
                      className="flex min-h-[42px] items-center justify-center rounded-xl border border-brand text-sm font-semibold text-brand transition-colors duration-150 hover:bg-brand-soft"
                    >
                      Your post — {t.offerCount} offer{t.offerCount === 1 ? '' : 's'}
                    </Link>
                  ) : (
                    <Link
                      href={`/app/apply/${t.id}`}
                      className="flex min-h-[42px] items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-hover"
                    >
                      Offer to help{t.offerCount > 0 ? ` · ${t.offerCount} offer${t.offerCount === 1 ? '' : 's'} in` : ''}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search/filters apply only to what's loaded so far; load more before
            expecting a search to cover the whole campus feed. */}
        {feedHasMore && !q && category === 'All' && (
          <button
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="block w-full rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-muted hover:bg-surface-sunken disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more tasks'}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense>
      <FindPageInner />
    </Suspense>
  );
}
