'use client';

import Link from 'next/link';
import { SponsoredCard } from '../../components/Sponsored';
import { adFor } from '../../lib/ads';
import { useStore } from '../../lib/store';
import { formatSgd } from '../../lib/format';
import { CategoryIcon } from '../../components/CategoryIcon';

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
  OPEN: { label: 'OPEN', cls: 'bg-accent-soft text-accent-text' },
  ASSIGNED: { label: 'ASSIGNED', cls: 'bg-brand-soft text-brand' },
  IN_PROGRESS: { label: 'IN PROGRESS', cls: 'bg-brand-soft text-brand' },
};

// Turn-state chips for the "Your offers" dashboard.
const OFFER_CHIP: Record<string, { label: string; cls: string }> = {
  yourTurn: { label: 'YOUR MOVE', cls: 'bg-green-100 text-success' },
  waiting: { label: 'WAITING', cls: 'bg-accent-soft text-accent-text' },
  won: { label: 'YOU GOT IT', cls: 'bg-brand-soft text-brand' },
  closed: { label: 'CLOSED', cls: 'bg-surface-sunken text-muted' },
};

export default function AppHome() {
  const { me, hydrating, myTasks, myOffers, savedTasks, cancelTask, unread } = useStore();
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
      <header className="flex items-center justify-between border-b bg-surface px-4 py-3">
        <span className="font-semibold">Hi {firstName} 👋</span>
        {/* On desktop the sidebar carries nav + activity, so hide the duplicate icons */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link href="/app/notifications" aria-label="Notifications" className="relative text-lg">
            🔔
            {unread > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
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
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Your active tasks</p>

            <div className="grid gap-2 lg:grid-cols-2">
              {hydrating ? (
                [0, 1].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border bg-surface p-3" aria-hidden="true">
                    <div className="h-4 w-2/3 rounded bg-surface-sunken" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-surface-sunken" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-surface-sunken" />
                  </div>
                ))
              ) : myTasks.map((t) => {
                const chip = STATUS_CHIP[t.status] ?? STATUS_CHIP.OPEN;
                return (
                  <div key={t.id} className="rounded-xl border bg-surface p-3">
                    <Link href={`/app/applicants/${t.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <span className="flex min-w-0 items-center gap-2.5 font-medium">
                          <CategoryIcon category={t.category} emoji={t.icon} size="sm" />
                          <span className="min-w-0 truncate leading-snug">{t.title}</span>
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {formatSgd(t.priceCents)}{t.study ? '/hr' : ''} · {t.hall} · {t.when}
                      </p>
                      <p className="mt-1 text-sm text-brand">
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

            {!hydrating && myTasks.length === 0 && (
              <div className="rounded-xl border border-dashed bg-surface p-6 text-center text-sm text-muted">
                <p className="text-2xl">📭</p>
                <p className="mt-1">Nothing active — post a task and offers roll in.</p>
              </div>
            )}

            {/* Buddy side: every negotiation you're in, with whose move it is */}
            {activeOffers.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Your offers</p>
                <div className="grid gap-2 lg:grid-cols-2">
                  {activeOffers.map((o) => {
                    const chip = o.won
                      ? OFFER_CHIP.won
                      : o.yourTurn
                        ? OFFER_CHIP.yourTurn
                        : OFFER_CHIP.waiting;
                    return (
                      <Link key={o.id} href={`/app/task/${o.taskId}`} className="block rounded-xl border bg-surface p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{o.taskTitle}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          Your number: {formatSgd(o.amountCents)} · round {o.round}
                        </p>
                        <p className="mt-1 text-sm text-brand">
                          {o.won ? 'Deal on — get it done ›' : o.yourTurn ? 'They responded — act now ›' : 'Waiting for their reply ›'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/app/history" className="text-sm font-medium text-brand">
                🕘 Past tasks & reviews ›
              </Link>
              <Link href="/app/saved" className="text-sm font-medium text-brand">
                🔖 Saved tasks{savedTasks.length > 0 ? ` (${savedTasks.length})` : ''} ›
              </Link>
            </div>
          </section>

          {/* Aside: quick-post + browse + sponsored */}
          <aside className="mt-6 space-y-5 lg:mt-0">
            {me?.campus === 'NTU' && (
              <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  New · Free
                </span>
                <h2 className="mt-3 font-semibold text-slate-900">Find your reciprocal hall swap</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter what you have and want. See only students whose preferences also match your room.
                </p>
                <Link href="/app/hall-swap" className="mt-3 block rounded-xl bg-blue-700 py-2.5 text-center text-sm font-medium text-white">
                  Try Hall Swap Matcher ›
                </Link>
              </section>
            )}

            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Post a task</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
                {QUICK.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/app/tasks/new?category=${q.slug}`}
                    className="rounded-xl border bg-surface py-3 text-center hover:border-blue-400"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </section>

            <Link
              href="/app/find"
              className="block rounded-xl border border-brand/30 bg-brand-soft py-3 text-center text-sm font-medium text-brand"
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
