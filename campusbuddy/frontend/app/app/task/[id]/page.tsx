'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LAUNDRY_STEPS } from '../../../../lib/mockTasks';
import { formatSgd } from '../../../../lib/format';
import { parseSgdToCents, useStore } from '../../../../lib/store';
import { api, ApiClientError, type ApiTask, type ApiOffer } from '../../../../lib/api';
import { TaskChat } from '../../../../components/TaskChat';
import { RateCard } from '../../../../components/RateCard';
import { ProblemActions } from '../../../../components/ProblemActions';
import { CategoryIcon } from '../../../../components/CategoryIcon';

// Grab-style status steps for a shopping / fetch-&-deliver run (grocery, 7-Eleven /
// Prime, parcels, food). The chat handles anything out of stock — agree a swap
// before buying — so this is just the live "where's my stuff" timeline.
const RUN_STEPS = [
  { label: 'Heading to the store', text: 'On my way to grab your stuff 🏃' },
  { label: 'At the store — picking up', text: 'At the store now, picking up your items 🛒' },
  { label: 'On the way to you', text: 'Got everything, heading to you 🛵' },
  { label: 'Dropped off', text: 'Delivered — enjoy! ✅' },
];

// Task page, provider side. Three phases against live data:
//  1. NEGOTIATING — your offer thread with the poster (turn-taking, live).
//  2. ASSIGNED — you got the deal. The flow adapts to the task type: contactless
//     laundry walks a status timeline; store runs get a shopping timeline with
//     chat for out-of-stock swaps; in-room jobs (cleaning) do an arrival
//     check-in; meet-ups (study help) just coordinate over chat. All end in the
//     real complete call.
//  3. COMPLETED — agreed-price recap. Payments are intentionally outside the
//     demo, so students settle directly after completion.
// If the viewer is the poster, they're redirected to their offers view.
export default function ActiveTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { subscribe, refresh } = useStore();

  const [task, setTask] = useState<ApiTask | null>(null);
  const [myOffer, setMyOffer] = useState<ApiOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // negotiation UI
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterVal, setCounterVal] = useState('');

  // in-person check-in theatre (real verification lands with the matric-scan flow)
  const [checkedIn, setCheckedIn] = useState(false);
  // contactless steps — local until status events persist server-side (Phase 2)
  const [step, setStep] = useState(0);

  const load = useCallback(async () => {
    try {
      const t = await api.task(id);
      setTask(t.task);
      if (t.task.isMine) {
        router.replace(`/app/applicants/${id}`);
        return;
      }
      const o = await api.offers(id); // non-owners get only their own thread
      setMyOffer(o.offers[0] ?? null);
      setError(null);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
    const off = subscribe((ev) => {
      // No taskId means the change came from the sync digest, which can't say
      // which task moved — refetch rather than miss it.
      if (!ev.taskId || ev.taskId === id) void load();
    });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 30_000); // safety net
    return () => {
      off();
      clearInterval(timer);
    };
  }, [load, subscribe, id]);

  async function act(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await Promise.all([load(), refresh()]); // refresh: my accept/complete updates Explore/Home too
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'That didn’t go through — try again.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-subtle">Loading task…</div>;
  if (!task) {
    return (
      <div className="p-6 text-center text-muted">
        Task not found. <Link href="/app/find" className="text-brand">Back to tasks</Link>
      </div>
    );
  }

  const iAmAssigned = task.status !== 'OPEN' && myOffer?.state === 'ACCEPTED';
  const agreedPriceCents = myOffer?.state === 'ACCEPTED' ? myOffer.amountCents : task.priceCents;

  // Which assigned-flow this task uses.
  const isRun = task.category === 'Convenience' || task.category === 'Food'; // grocery / 7-11 / parcel / food
  const isStudy = task.category === 'Study help';
  const activeSteps = task.contactless ? LAUNDRY_STEPS : isRun ? RUN_STEPS : [];
  const stepsDone = step >= activeSteps.length;
  const lastSent = step > 0 ? activeSteps[step - 1]?.text : null;

  const chip =
    task.status === 'OPEN'
      ? { label: myOffer ? 'NEGOTIATING' : 'OPEN', cls: 'bg-accent-soft text-accent-text' }
      : task.status === 'COMPLETED'
        ? { label: 'COMPLETED', cls: 'bg-green-100 text-success' }
        : { label: task.status.replace('_', ' '), cls: 'bg-brand-soft text-brand' };

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            <Link href="/app/find" className="text-muted">‹ </Link>
            <CategoryIcon category={task.category} emoji={task.icon} size="sm" /> {task.title}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {task.hall} · with {task.customerName} · agreed price {formatSgd(agreedPriceCents)}
        </p>
      </header>

      <div className="space-y-4 p-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        {/* ---------- Phase 1: negotiation ---------- */}
        {task.status === 'OPEN' && myOffer && (
          <div className="rounded-xl border bg-surface p-4">
            <p className="font-medium">🤝 Your negotiation with {task.customerName}</p>
            <p className="mt-2 text-2xl font-semibold text-success">{formatSgd(myOffer.amountCents)}</p>
            <p className="text-xs text-subtle">
              round {myOffer.round} ·{' '}
              {myOffer.yourTurn
                ? `${task.customerName} countered — your move`
                : 'waiting for their response'}
            </p>

            {myOffer.state === 'DECLINED' ? (
              <p className="mt-3 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-muted">
                This one went to another buddy — more tasks are waiting in Explore.
              </p>
            ) : myOffer.yourTurn ? (
              counterOpen ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted">Counter S$</span>
                  <input
                    type="number"
                    value={counterVal}
                    onChange={(e) => setCounterVal(e.target.value)}
                    className="w-20 rounded-lg border px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() =>
                      void act(async () => {
                        const cents = parseSgdToCents(counterVal);
                        setCounterOpen(false);
                        await api.counterOffer(myOffer.id, cents);
                      })
                    }
                    disabled={parseSgdToCents(counterVal) <= 0 || busy}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Send'}
                  </button>
                  <button onClick={() => setCounterOpen(false)} className="text-sm text-subtle">Cancel</button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void act(() => api.acceptOffer(myOffer.id))}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {busy ? 'Accepting…' : `Accept ${formatSgd(myOffer.amountCents)} — deal`}
                  </button>
                  <button
                    onClick={() => {
                      setCounterOpen(true);
                      setCounterVal(String(Math.round(myOffer.amountCents / 100)));
                    }}
                    disabled={busy}
                    className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text"
                  >
                    Counter
                  </button>
                </div>
              )
            ) : (
              <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
                ⏳ We&apos;ll notify you when {task.customerName} accepts or counters.
              </p>
            )}

            {(myOffer.state === 'PENDING' || myOffer.state === 'COUNTERED') && !counterOpen && (
              <button
                onClick={() => void act(() => api.withdrawOffer(myOffer.id))}
                disabled={busy}
                className="mt-2 text-xs text-subtle hover:text-red-500"
              >
                Withdraw my offer
              </button>
            )}
          </div>
        )}

        {task.status === 'OPEN' && !myOffer && (
          <div className="rounded-xl border border-dashed bg-surface p-6 text-center text-sm text-muted">
            You haven&apos;t offered on this task yet.
            <Link href={`/app/apply/${task.id}`} className="mt-2 block font-medium text-brand">
              Make an offer ›
            </Link>
          </div>
        )}

        {/* ---------- Phase 3: completed ---------- */}
        {task.status === 'COMPLETED' && (
          <div className="rounded-xl bg-success-soft p-4 text-center text-sm text-green-800">
            ✅ <b>Task complete — agreed price {formatSgd(agreedPriceCents)}.</b>
            <span className="mt-1 block">Settle directly with {task.customerName}; CampusBuddy does not process payment in this demo.</span>
            <Link href="/app/find" className="mt-2 block font-medium underline">
              Find more tasks
            </Link>
          </div>
        )}
        {task.status === 'COMPLETED' && myOffer?.state === 'ACCEPTED' && (
          <RateCard taskId={task.id} counterpartName={task.customerName} />
        )}

        {/* ---------- Phase 2: assigned to me — flow adapts to the task type ---------- */}
        {iAmAssigned && task.status !== 'COMPLETED' && (
          task.contactless || isRun ? (
            /* Grab-style status timeline: contactless laundry, or a store/food run */
            <div className="rounded-xl border bg-surface p-4">
              <p className="font-medium">{task.contactless ? '📦 Contactless laundry' : '🛒 Shopping run'}</p>
              <p className="mt-1 text-sm text-muted">
                {task.contactless
                  ? `${task.customerName} leaves the bag outside the door — no room entry. Tap each step to update them live, like Grab.`
                  : `Grab ${task.customerName}'s items and tap each step so they can follow along, like Grab.`}
              </p>

              {isRun && (
                <div className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-text">
                  🛒 <b>Something out of stock?</b> Message {task.customerName} in the chat below and
                  agree a swap <b>before</b> you buy it.
                </div>
              )}

              {lastSent && (
                <div className="mt-3 rounded-lg bg-brand-soft p-3 text-sm text-brand-hover">
                  📲 Texted {task.customerName}: “{lastSent}”
                </div>
              )}

              <ol className="mt-4 space-y-3">
                {activeSteps.map((s, i) => {
                  const state = i < step ? 'done' : i === step ? 'current' : 'todo';
                  return (
                    <li key={s.label} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          state === 'done'
                            ? 'bg-green-600 text-white'
                            : state === 'current'
                              ? 'bg-brand text-white'
                              : 'bg-slate-200 text-muted'
                        }`}
                      >
                        {state === 'done' ? '✓' : i + 1}
                      </span>
                      <span className={state === 'todo' ? 'text-subtle' : 'font-medium'}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>

              {!stepsDone ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="mt-4 block w-full rounded-xl bg-brand py-3 font-medium text-white"
                >
                  Update: {activeSteps[step].label}
                </button>
              ) : (
                <button
                  onClick={() => void act(() => api.completeTask(task.id))}
                  disabled={busy}
                  className="mt-4 block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:opacity-60"
                >
                  {busy ? 'Finishing…' : `Mark complete · ${formatSgd(agreedPriceCents)} agreed`}
                </button>
              )}
            </div>
          ) : task.presenceRequired ? (
            /* In-room job (cleaning, moving): arrival check-in, then complete */
            <>
              <div className="rounded-xl border bg-surface p-4">
                <p className="font-medium">📍 Arrival check-in</p>
                <p className="mt-1 text-sm text-muted">
                  At {task.customerName}&apos;s door, confirm it&apos;s really you so the buddy they
                  accepted is the one who showed up. Live matric-card scan lands with the
                  verification flow — for now check-in pings {task.customerName} that you&apos;ve
                  arrived.
                </p>

                {checkedIn ? (
                  <div className="mt-3 rounded-lg bg-success-soft p-3 text-sm text-green-800">
                    ✅ <b>Checked in.</b> {task.customerName} now sees: “Your buddy has arrived.”
                  </div>
                ) : (
                  <button
                    onClick={() => setCheckedIn(true)}
                    className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white"
                  >
                    🎓 Check in at the door
                  </button>
                )}

                <p className="mt-3 text-xs text-subtle">
                  🔒 The matric number is never shown — verification only returns an identity match.
                </p>
              </div>

              <button
                onClick={() => void act(() => api.completeTask(task.id))}
                disabled={!checkedIn || busy}
                className="block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Finishing…' : checkedIn ? 'Mark task complete' : 'Check in to start the task'}
              </button>
            </>
          ) : (
            /* Meet-up (study help, spare meal, etc.): coordinate over chat, then complete */
            <div className="rounded-xl border bg-surface p-4">
              <p className="font-medium">{isStudy ? '📚 Study session' : '🤝 Meet-up'}</p>

              {isStudy && task.study ? (
                <>
                  <p className="mt-1 text-sm text-muted">
                    Here&apos;s exactly what {task.customerName} needs — use the chat below to dig into
                    specifics, agree what to cover, share materials, and set a time &amp; place.
                  </p>
                  <div className="mt-3 rounded-lg bg-surface-sunken p-3 text-sm">
                    <p className="font-medium">📖 {task.study.module}</p>
                    <div className="mt-2 space-y-1 text-muted">
                      <p><span className="text-subtle">Topics:</span> {task.study.topics.join(', ')}</p>
                      <p><span className="text-subtle">Level:</span> {task.study.level}</p>
                      <p><span className="text-subtle">Goal:</span> {task.study.goal}</p>
                      <p><span className="text-subtle">Format:</span> {task.study.format}</p>
                    </div>
                    {task.study.helpTypes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {task.study.helpTypes.map((h) => (
                          <span key={h} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent-text">
                    📚 Tutoring only — explain and coach; don&apos;t do the work for them.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  Sort out the where &amp; when with {task.customerName} in the chat below, then mark it
                  complete once you&apos;re done.
                </p>
              )}

              <button
                onClick={() => void act(() => api.completeTask(task.id))}
                disabled={busy}
                className="mt-3 block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:opacity-60"
              >
                {busy ? 'Finishing…' : `Mark complete · ${formatSgd(agreedPriceCents)} agreed`}
              </button>
            </div>
          )
        )}

        {/* Chat + off-ramps, shown directly under the active flow */}
        {iAmAssigned && task.status !== 'COMPLETED' && (
          <TaskChat taskId={task.id} counterpartName={task.customerName} />
        )}
        {iAmAssigned && (
          <ProblemActions
            taskId={task.id}
            canCancel={task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS'}
            onChanged={async () => { await load(); }}
          />
        )}

        {/* Assigned, but to someone else */}
        {task.status !== 'OPEN' && task.status !== 'COMPLETED' && !iAmAssigned && (
          <div className="rounded-xl border border-dashed bg-surface p-6 text-center text-sm text-muted">
            This task went to another buddy — more are waiting in Explore.
            <Link href="/app/find" className="mt-2 block font-medium text-brand">Browse tasks ›</Link>
          </div>
        )}
      </div>
    </div>
  );
}
