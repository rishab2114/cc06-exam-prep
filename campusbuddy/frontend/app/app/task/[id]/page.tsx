'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LAUNDRY_STEPS } from '../../../../lib/mockTasks';
import { feeBreakdown, formatSgd } from '../../../../lib/format';
import { parseSgdToCents } from '../../../../lib/store';
import { api, ApiClientError, type ApiTask, type ApiOffer } from '../../../../lib/api';
import { TaskChat } from '../../../../components/TaskChat';
import { RateCard } from '../../../../components/RateCard';

// Task page, provider side. Three phases against live data:
//  1. NEGOTIATING — your offer thread with the poster: accept their counter or
//     counter back (turn-taking, enforced server-side). Polls so their moves
//     appear live.
//  2. ASSIGNED — you got the deal. Contactless tasks walk the Grab-style status
//     timeline; in-person tasks do the arrival check-in. Both end in the real
//     complete call.
//  3. COMPLETED — earnings recap.
// If the viewer is the poster, they're redirected to their offers view.
export default function ActiveTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

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
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 8_000);
    return () => clearInterval(timer);
  }, [load]);

  async function act(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'That didn’t go through — try again.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-slate-400">Loading task…</div>;
  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app/find" className="text-blue-700">Back to tasks</Link>
      </div>
    );
  }

  const iAmAssigned = task.status !== 'OPEN' && myOffer?.state === 'ACCEPTED';
  const agreedCents = myOffer?.state === 'ACCEPTED' ? myOffer.amountCents : task.priceCents;
  const earnings = feeBreakdown(agreedCents).buddyGets;
  const laundryDone = step >= LAUNDRY_STEPS.length;
  const lastSent = step > 0 ? LAUNDRY_STEPS[step - 1].text : null;

  const chip =
    task.status === 'OPEN'
      ? { label: myOffer ? 'NEGOTIATING' : 'OPEN', cls: 'bg-amber-100 text-amber-700' }
      : task.status === 'COMPLETED'
        ? { label: 'COMPLETED', cls: 'bg-green-100 text-green-700' }
        : { label: task.status.replace('_', ' '), cls: 'bg-blue-100 text-blue-700' };

  return (
    <div>
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            <Link href="/app/find" className="text-slate-500">‹ </Link>
            {task.icon} {task.title}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {task.hall} · with {task.customerName} · you earn {formatSgd(earnings)}
        </p>
      </header>

      <div className="space-y-4 p-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {/* ---------- Phase 1: negotiation ---------- */}
        {task.status === 'OPEN' && myOffer && (
          <div className="rounded-xl border bg-white p-4">
            <p className="font-medium">🤝 Your negotiation with {task.customerName}</p>
            <p className="mt-2 text-2xl font-semibold text-green-700">{formatSgd(myOffer.amountCents)}</p>
            <p className="text-xs text-slate-400">
              round {myOffer.round} ·{' '}
              {myOffer.yourTurn
                ? `${task.customerName} countered — your move`
                : 'waiting for their response'}
            </p>

            {myOffer.state === 'DECLINED' ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                This one went to another buddy — more tasks are waiting in Explore.
              </p>
            ) : myOffer.yourTurn ? (
              counterOpen ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">Counter S$</span>
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
                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Send'}
                  </button>
                  <button onClick={() => setCounterOpen(false)} className="text-sm text-slate-400">Cancel</button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void act(() => api.acceptOffer(myOffer.id))}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {busy ? 'Accepting…' : `Accept ${formatSgd(myOffer.amountCents)} — deal`}
                  </button>
                  <button
                    onClick={() => {
                      setCounterOpen(true);
                      setCounterVal(String(Math.round(myOffer.amountCents / 100)));
                    }}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Counter
                  </button>
                </div>
              )
            ) : (
              <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                ⏳ We&apos;ll notify you when {task.customerName} accepts or counters.
              </p>
            )}
          </div>
        )}

        {task.status === 'OPEN' && !myOffer && (
          <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
            You haven&apos;t offered on this task yet.
            <Link href={`/app/apply/${task.id}`} className="mt-2 block font-medium text-blue-700">
              Make an offer ›
            </Link>
          </div>
        )}

        {/* ---------- Phase 3: completed ---------- */}
        {task.status === 'COMPLETED' && (
          <div className="rounded-xl bg-green-50 p-4 text-center text-sm text-green-800">
            ✅ <b>Task complete — you earned {formatSgd(earnings)}.</b>
            <Link href="/app/find" className="mt-2 block font-medium underline">
              Find more tasks
            </Link>
          </div>
        )}
        {task.status === 'COMPLETED' && myOffer?.state === 'ACCEPTED' && (
          <RateCard taskId={task.id} counterpartName={task.customerName} />
        )}

        {/* Coordinate the handoff once the deal is made */}
        {iAmAssigned && task.status !== 'COMPLETED' && (
          <TaskChat taskId={task.id} counterpartName={task.customerName} />
        )}

        {/* ---------- Phase 2: assigned to me ---------- */}
        {iAmAssigned && task.status !== 'COMPLETED' && (
          task.contactless ? (
            /* Contactless: Grab-style status updates, ends in the real complete call */
            <div className="rounded-xl border bg-white p-4">
              <p className="font-medium">📦 Contactless task</p>
              <p className="mt-1 text-sm text-slate-500">
                {task.customerName} leaves the bag outside the door — no room entry. Tap each step to
                update them live, like Grab.
              </p>

              {lastSent && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  📲 Texted {task.customerName}: “{lastSent}”
                </div>
              )}

              <ol className="mt-4 space-y-3">
                {LAUNDRY_STEPS.map((s, i) => {
                  const state = i < step ? 'done' : i === step ? 'current' : 'todo';
                  return (
                    <li key={s.label} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          state === 'done'
                            ? 'bg-green-600 text-white'
                            : state === 'current'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {state === 'done' ? '✓' : i + 1}
                      </span>
                      <span className={state === 'todo' ? 'text-slate-400' : 'font-medium'}>
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {!laundryDone ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="mt-4 block w-full rounded-xl bg-blue-700 py-3 font-medium text-white"
                >
                  Update: {LAUNDRY_STEPS[step].label}
                </button>
              ) : (
                <button
                  onClick={() => void act(() => api.completeTask(task.id))}
                  disabled={busy}
                  className="mt-4 block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:opacity-60"
                >
                  {busy ? 'Finishing…' : `Mark complete — you earn ${formatSgd(earnings)}`}
                </button>
              )}
            </div>
          ) : (
            /* In-person: arrival check-in, then the real complete call */
            <>
              <div className="rounded-xl border bg-white p-4">
                <p className="font-medium">📍 Arrival check-in</p>
                <p className="mt-1 text-sm text-slate-500">
                  At {task.customerName}&apos;s door, confirm it&apos;s really you so the buddy they
                  accepted is the one who showed up. Live matric-card scan lands with the
                  verification flow — for now check-in pings {task.customerName} that you&apos;ve
                  arrived.
                </p>

                {checkedIn ? (
                  <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
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

                <p className="mt-3 text-xs text-slate-400">
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
          )
        )}

        {/* Assigned, but to someone else */}
        {task.status !== 'OPEN' && task.status !== 'COMPLETED' && !iAmAssigned && (
          <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
            This task went to another buddy — more are waiting in Explore.
            <Link href="/app/find" className="mt-2 block font-medium text-blue-700">Browse tasks ›</Link>
          </div>
        )}
      </div>
    </div>
  );
}
