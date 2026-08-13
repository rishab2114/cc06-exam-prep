'use client';

import Link from 'next/link';
import { formatSgd } from '../../../lib/format';
import { useStore } from '../../../lib/store';
import { CategoryIcon } from '../../../components/CategoryIcon';
import { Bookmark } from 'lucide-react';

// Saved (bookmarked) tasks — things you might want to offer on later. Same
// card shape as Explore, minus the filter chrome.
export default function SavedPage() {
  const { savedTasks, toggleSave } = useStore();

  return (
    <div>
      <header className="border-b bg-surface px-4 py-3 font-semibold">
        <Link href="/app" className="text-muted">‹ </Link> Saved tasks
      </header>

      <div className="space-y-3 p-4">
        {savedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
            <Bookmark size={30} className="mx-auto text-subtle" aria-hidden="true" />
            <p className="mt-2 font-medium text-text">Nothing saved yet</p>
            <p className="mt-1">Tap the bookmark on any task in Explore to save it for later.</p>
            <Link href="/app/find" className="mt-3 block font-medium text-brand">Browse tasks ›</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedTasks.map((t) => (
              <div key={t.id} className="relative flex flex-col rounded-xl border bg-surface p-3">
                <button
                  onClick={() => void toggleSave(t.id)}
                  aria-label="Remove bookmark"
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-accent"
                >
                  <Bookmark size={17} fill="currentColor" aria-hidden="true" />
                </button>
                <div className="flex items-start gap-2.5 pr-6">
                  <CategoryIcon category={t.category} emoji={t.icon} size="sm" />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <span className="min-w-0 font-medium leading-snug">{t.title}</span>
                    <span className="shrink-0 text-success">
                      {formatSgd(t.priceCents)}{t.study ? '/hr' : ''}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t.hall} · {t.when} · by {t.customerName}
                </p>
                <div className="mt-auto pt-2">
                  {t.isMine ? (
                    <Link
                      href={`/app/applicants/${t.id}`}
                      className="block rounded-lg border border-brand py-2 text-center text-sm font-medium text-brand"
                    >
                      Your post — {t.offerCount} offer{t.offerCount === 1 ? '' : 's'}
                    </Link>
                  ) : (
                    <Link
                      href={`/app/apply/${t.id}`}
                      className="block rounded-lg bg-brand py-2 text-center text-sm font-medium text-white"
                    >
                      Offer to help
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
