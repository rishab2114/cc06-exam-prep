import Link from 'next/link';
import { SponsoredCard } from '../../components/Sponsored';
import { adFor } from '../../lib/ads';

// Customer home / marketplace (wireframe #2, docs/05). Mock data for the demo.
const QUICK = [
  { slug: 'room-cleaning', label: '🧹 Clean' },
  { slug: 'laundry-pickup', label: '🧺 Laundry' },
  { slug: 'spare-meal', label: '🍱 Spare meal' },
  { slug: 'grocery-shopping', label: '🛒 Grocery' },
  { slug: 'parcel-collection', label: '📦 Parcel' },
  { slug: 'grocery-shopping&store=convenience', label: '🏪 7-Eleven / Prime' },
];

export default function AppHome() {
  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">Hi Priya 👋</span>
        <span className="text-slate-400">🔔 ⚙ 👤</span>
      </header>

      <div className="space-y-5 p-4">
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="🔎 Search services..."
        />

        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Quick post</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {QUICK.map((q) => (
              <Link
                key={q.slug}
                href={`/app/tasks/new?category=${q.slug}`}
                className="rounded-xl border bg-white py-3 text-center"
              >
                {q.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Your active tasks</p>
          <Link href="/app/applicants/room-cleaning" className="block rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Room clean</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">OPEN</span>
            </div>
            <p className="mt-1 text-sm text-blue-700">3 applicants ›</p>
          </Link>
          <Link href="/app/track/laundry-pickup" className="block rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Laundry pickup & wash</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">IN PROGRESS</span>
            </div>
            <p className="mt-1 text-sm text-blue-700">Track live ›</p>
          </Link>
        </section>

        <SponsoredCard ad={adFor(0)} />

        <Link
          href="/app/tasks/new"
          className="block rounded-xl bg-blue-700 py-3 text-center font-medium text-white"
        >
          + New task
        </Link>
      </div>
    </div>
  );
}
