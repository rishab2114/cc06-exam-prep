'use client';

import Link from 'next/link';
import { SponsoredCard } from '../../components/Sponsored';
import { adFor } from '../../lib/ads';
import { useStore } from '../../lib/store';
import { formatSgd } from '../../lib/format';

// Customer home. "Your active tasks" is live from the API — everything you've
// posted that's still open/assigned, with real offer counts.
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

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'OPEN', cls: 'bg-amber-100 text-amber-700' },
  ASSIGNED: { label: 'ASSIGNED', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'IN PROGRESS', cls: 'bg-blue-100 text-blue-700' },
};

// Turn-state chips for the "Your offers" dashboard.
const OFFER_CHIP: Record<string, { label: string; cls: string }> = {
  yourTurn: { label: 'YOUR MOVE', cls: 'bg-green-100 text-green-700' },
  waiting: { label: 'WAITING', cls: 'bg-amber-100 text-amber-700' },
  won: { label: 'YOU GOT IT', cls: 'bg-blue-100 text-blue-700' },
  closed: { label: 'CLOSED', cls: 'bg-slate-100 text-slate-500' },
};

export default function AppHome() {
  const { me, myTasks, myOffers, savedTasks, cancelTask, unread } = useStore();
  const firstName = me?.name.split(' ')[0] ?? 'there';

  // Show live negotiations + deals in progress; hide old closed threads.
  const activeOffers = myOffers.filter(
    (o) =>
      o.state === 'PENDING' ||
      o.state === 'COUNTERED' ||
      (o.won && (o.taskStatus === 'ASSIGNED' || o.taskStatus === 'IN_PROGRESS')),
  );

  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">Hi {firstName} 👋</span>
        {/* On desktop the sidebar carries nav + activity, so hide the duplicate icons */}
        <div className="flex items-center gap-3 lg:hidden">
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

      <div className="p-4 lg:px-0 lg:pt-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main column: your active tasks (returning users care about these first) */}
          <section className="lg:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Your active tasks</p>

            <div className="grid gap-2 lg:grid-cols-2">
              {myTasks.map((t) => {
                const chip = STATUS_CHIP[t.status] ?? STATUS_CHIP.OPEN;
                return (
                  <div key={t.id} className="rounded-xl border bg-white p-3">
                    <Link href={`/app/applicants/${t.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.icon} {t.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatSgd(t.priceCents)}{t.study ? '/hr' : ''} · {t.hall} · {t.when}
                      </p>
                      <p className="mt-1 text-sm text-blue-700">
                        {t.status === 'OPEN'
                          ? t.offerCount > 0
                            ? `${t.offerCount} offer${t.offerCount === 1 ? '' : 's'} — accept or bargain ›`
                            : 'Waiting for offers ›'
                          : 'View your buddy ›'}
                      </p>
                    </Link>
                    {t.status === 'OPEN' && (
                      <button
                        onClick={() => void cancelTask(t.id)}
                        className="mt-2 text-xs text-red-500"
                        aria-label={`Cancel task ${t.title}`}
                      >
                        Cancel task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {myTasks.length === 0 && (
              <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
                <p className="text-2xl">📭</p>
                <p className="mt-1">Nothing active — post a task and offers roll in.</p>
              </div>
            )}

            {/* Buddy side: every negotiation you're in, with whose move it is */}
            {activeOffers.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Your offers</p>
                <div className="grid gap-2 lg:grid-cols-2">
                  {activeOffers.map((o) => {
                    const chip = o.won
                      ? OFFER_CHIP.won
                      : o.yourTurn
                        ? OFFER_CHIP.yourTurn
                        : OFFER_CHIP.waiting;
                    return (
                      <Link key={o.id} href={`/app/task/${o.taskId}`} className="block rounded-xl border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{o.taskTitle}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Your number: {formatSgd(o.amountCents)} · round {o.round}
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          {o.won ? 'Deal on — get it done ›' : o.yourTurn ? 'They responded — act now ›' : 'Waiting for their reply ›'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/app/history" className="text-sm font-medium text-blue-700">
                🕘 Past tasks & reviews ›
              </Link>
              <Link href="/app/saved" className="text-sm font-medium text-blue-700">
                🔖 Saved tasks{savedTasks.length > 0 ? ` (${savedTasks.length})` : ''} ›
              </Link>
            </div>
          </section>

          {/* Aside: quick-post + browse + sponsored */}
          <aside className="mt-6 space-y-5 lg:mt-0">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Post a task</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
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
          </aside>
        </div>
      </div>
    </div>
  );
}
