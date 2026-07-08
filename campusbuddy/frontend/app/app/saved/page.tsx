'use client';

import Link from 'next/link';
import { formatSgd } from '../../../lib/format';
import { useStore } from '../../../lib/store';

// Saved (bookmarked) tasks — things you might want to offer on later. Same
// card shape as Explore, minus the filter chrome.
export default function SavedPage() {
  const { savedTasks, toggleSave } = useStore();

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> Saved tasks
      </header>

      <div className="space-y-3 p-4">
        {savedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            <p className="text-3xl">🔖</p>
            <p className="mt-2 font-medium text-slate-700">Nothing saved yet</p>
            <p className="mt-1">Tap the bookmark on any task in Explore to save it for later.</p>
            <Link href="/app/find" className="mt-3 block font-medium text-blue-700">Browse tasks ›</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedTasks.map((t) => (
              <div key={t.id} className="relative flex flex-col rounded-xl border bg-white p-3">
                <button
                  onClick={() => void toggleSave(t.id)}
                  aria-label="Remove bookmark"
                  className="absolute right-2 top-2 text-lg text-amber-500"
                >
                  🔖
                </button>
                <div className="flex justify-between pr-6">
                  <span className="font-medium">{t.icon} {t.title}</span>
                  <span className="shrink-0 text-green-700">
                    {formatSgd(t.priceCents)}{t.study ? '/hr' : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {t.hall} · {t.when} · by {t.customerName}
                </p>
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
