'use client';

import Link from 'next/link';
import { SponsoredCard } from '../../components/Sponsored';
import { adFor } from '../../lib/ads';
import { useStore } from '../../lib/store';
import { formatSgd } from '../../lib/format';

// Customer home. "Your active tasks" is LIVE — tasks you post appear here (and in
// Explore) and persist across refreshes. Two seeded demo tasks stay so the accept/
// bargain and live-tracking flows are always explorable.
const QUICK = [
  { slug: 'room-cleaning', label: '🧹 Clean' },
  { slug: 'laundry-pickup', label: '🧺 Laundry' },
  { slug: 'spare-meal', label: '🍱 Spare meal' },
  { slug: 'grocery-shopping', label: '🛒 Grocery' },
  { slug: 'parcel-collection', label: '📦 Parcel' },
  { slug: 'room-move', label: '🧳 Move/Shift' },
  { slug: 'study-help', label: '📚 Study help' },
  { slug: 'grocery-shopping&store=convenience', label: '🏪 7-Eleven / Prime' },
];

export default function AppHome() {
  const { myTasks, cancelTask, unread } = useStore();

  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">Hi Priya 👋</span>
        <div className="flex items-center gap-3">
          <Link href="/app/notifications" aria-label="Notifications" className="relative text-lg">
            🔔
            {unread > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link href="/app/profile" aria-label="Profile" className="text-lg">👤</Link>
        </div>
      </header>

      <div className="space-y-5 p-4">
        {/* Hierarchy: active tasks first (returning users), then post, then browse */}
        <section className="space-y-2">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Your active tasks</p>

          {myTasks.map((t) => (
            <div key={t.id} className="rounded-xl border bg-white p-3">
              <Link href={`/app/applicants/${t.id}`} className="block">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.icon} {t.title}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">OPEN</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatSgd(t.priceCents)}{t.study ? '/hr' : ''} · {t.hall} · {t.when}
                </p>
                <p className="mt-1 text-sm text-blue-700">View applicants ›</p>
              </Link>
              <button
                onClick={() => cancelTask(t.id)}
                className="mt-2 text-xs text-red-500"
                aria-label={`Cancel task ${t.title}`}
              >
                Cancel task
              </button>
            </div>
          ))}

          {/* Seeded demo tasks so the full flows are always explorable */}
          <Link href="/app/applicants/room-cleaning" className="block rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Room clean</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">OPEN</span>
            </div>
            <p className="mt-1 text-sm text-blue-700">3 applicants — accept or bargain ›</p>
          </Link>
          <Link href="/app/track/laundry-pickup" className="block rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Laundry pickup & wash</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">IN PROGRESS</span>
            </div>
            <p className="mt-1 text-sm text-blue-700">Track live ›</p>
          </Link>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Post a task</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {QUICK.map((q) => (
              <Link
                key={q.slug}
                href={`/app/tasks/new?category=${q.slug}`}
                className="rounded-xl border bg-white py-3 text-center hover:border-blue-400"
              >
                {q.label}
              </Link>
            ))}
          </div>
        </section>

        <Link
          href="/app/find"
          className="block rounded-xl border border-blue-200 bg-blue-50 py-3 text-center text-sm font-medium text-blue-700"
        >
          🔎 Browse open tasks near you ›
        </Link>

        <SponsoredCard ad={adFor(0)} />
      </div>
    </div>
  );
}
