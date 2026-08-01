'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatSgd } from '../../../../lib/format';
import { useStore, parseSgdToCents } from '../../../../lib/store';
import { api, ApiClientError, type ApiTask, type ApiOffer } from '../../../../lib/api';
import { TaskChat } from '../../../../components/TaskChat';
import { RateCard } from '../../../../components/RateCard';
import { ProblemActions } from '../../../../components/ProblemActions';
import { EditTask } from '../../../../components/EditTask';
import { CategoryIcon } from '../../../../components/CategoryIcon';

// Customer view of one task: every offer thread, with REAL turn-taking
// bargaining. Each buddy has a live number on the table; whoever moved last
// waits (the server enforces it — `yourTurn` comes from the state machine).
// Accept runs the serializable accept transaction: task assigned, siblings
// declined. Polls while open so the other side's counters appear live.
export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { refresh, subscribe } = useStore();

  const [task, setTask] = useState<ApiTask | null>(null);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterVal, setCounterVal] = useState('');
  const [acting, setActing] = useState<string | null>(null); // offer id mid-request

  const load = useCallback(async () => {
    try {
      const [t, o] = await Promise.all([api.task(id), api.offers(id)]);
      setTask(t.task);
      setOffers(o.offers);
      setError(null);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) setTask(null);
      else setError(e instanceof ApiClientError ? e.message : 'Could not load — retrying…');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    // Realtime: refetch the instant an offer/counter/withdraw/decline lands.
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

  async function act(offerId: string, fn: () => Promise<unknown>) {
    if (acting) return;
    setActing(offerId);
    setError(null);
    try {
      await fn();
      await Promise.all([load(), refresh()]);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'That didn’t go through — try again.');
      await load(); // state may have moved under us (e.g. task just taken)
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-subtle">Loading offers…</div>;
  }
  if (!task) {
    return (
      <div className="p-6 text-center text-muted">
        Task not found. <Link href="/app" className="text-brand">Home</Link>
      </div>
    );
  }

  const assigned = task.status !== 'OPEN';
  const open = offers.filter((o) => o.state === 'PENDING' || o.state === 'COUNTERED');
  const accepted = offers.find((o) => o.state === 'ACCEPTED');
  const ranked = [...open].sort((a, b) => a.amountCents - b.amountCents);

  function openCounter(o: ApiOffer) {
    setCounterOpen(o.id);
    // pre-fill a sensible number: midpoint between your budget and their price
    setCounterVal(String(Math.round((o.amountCents / 100 + task!.priceCents / 100) / 2)));
  }

  return (
    <div className="lg:mx-auto lg:max-w-3xl">
      <header className="border-b bg-surface px-4 py-3">
        <span className="font-semibold">
          <Link href="/app" className="text-muted">‹ </Link>
          <CategoryIcon category={task.category} emoji={task.icon} size="sm" /> {task.title}
        </span>
        <p className="mt-1 text-sm text-muted">
          You listed {formatSgd(task.priceCents)}{task.study ? '/hr' : ''} ·{' '}
          {assigned
            ? `status: ${task.status.toLowerCase().replace('_', ' ')}`
            : `${open.length} offer${open.length === 1 ? '' : 's'} — accept a price or bargain`}
        </p>
      </header>

      <div className="space-y-3 p-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        {!assigned && (
          <EditTask
            key={`${task.priceCents}-${task.hall}-${task.when}-${task.description ?? ''}`}
            task={task}
            onSaved={async () => { await Promise.all([load(), refresh()]); }}
          />
        )}

        {accepted && (
          <div className="rounded-xl border border-green-300 bg-surface p-3">
            <p className="font-medium">🤝 Deal with {accepted.providerName}</p>
            <p className="mt-1 text-sm text-muted">
              Agreed at <b className="text-success">{formatSgd(accepted.amountCents)}</b>
              {task.status === 'COMPLETED' ? ' · completed ✅' : ' · they’ll get it done and mark it complete.'}
            </p>
          </div>
        )}

        {accepted && task.status !== 'COMPLETED' && (
          <TaskChat taskId={task.id} counterpartName={accepted.providerName} />
        )}
        {accepted && task.status === 'COMPLETED' && (
          <RateCard taskId={task.id} counterpartName={accepted.providerName} />
        )}
        {accepted && (
          <ProblemActions
            taskId={task.id}
            canCancel={task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS'}
            onChanged={async () => { await Promise.all([load(), refresh()]); }}
          />
        )}

        {!assigned &&
          ranked.map((o) => {
            const diff = o.amountCents - task.priceCents;
            const busy = acting === o.id;
            return (
              <div key={o.id} className="rounded-xl border bg-surface p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {o.providerName}{' '}
                      <span className="text-sm font-normal text-muted">
                        {o.providerRating !== null
                          ? `⭐${o.providerRating} · ${o.providerJobs} job${o.providerJobs === 1 ? '' : 's'}`
                          : '🪪 campus-verified · new buddy'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-subtle">
                      round {o.round} · {o.yourTurn ? 'your move' : 'waiting for them'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success">{formatSgd(o.amountCents)}</p>
                    <p className="text-xs text-subtle">
                      {diff === 0 ? 'at your budget' : diff > 0 ? `+${formatSgd(diff)}` : `−${formatSgd(-diff)}`}
                    </p>
                  </div>
                </div>

                {o.message && (
                  <p className="mt-2 rounded-lg bg-surface-sunken px-2 py-1 text-sm text-muted">“{o.message}”</p>
                )}

                {o.yourTurn ? (
                  counterOpen === o.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted">Offer S$</span>
                      <input
                        type="number"
                        value={counterVal}
                        onChange={(e) => setCounterVal(e.target.value)}
                        className="w-20 rounded-lg border px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          void act(o.id, async () => {
                            const cents = parseSgdToCents(counterVal);
                            setCounterOpen(null);
                            await api.counterOffer(o.id, cents);
                          })
                        }
                        disabled={parseSgdToCents(counterVal) <= 0 || busy}
                        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {busy ? 'Sending…' : 'Send counter'}
                      </button>
                      <button onClick={() => setCounterOpen(null)} className="text-sm text-subtle">Cancel</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => void act(o.id, () => api.acceptOffer(o.id))}
                        disabled={busy}
                        className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {busy ? 'Accepting…' : `Accept ${formatSgd(o.amountCents)}`}
                      </button>
                      <button
                        onClick={() => openCounter(o)}
                        disabled={busy}
                        className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text"
                      >
                        {o.round > 1 ? 'Counter again' : 'Bargain'}
                      </button>
                    </div>
                  )
                ) : (
                  <p className="mt-2 rounded-lg bg-brand-soft px-2 py-1.5 text-sm text-brand">
                    ⏳ You countered {formatSgd(o.amountCents)} — waiting for {o.providerName} to accept
                    or counter back.
                  </p>
                )}

                {counterOpen !== o.id && (
                  <button
                    onClick={() => void act(o.id, () => api.declineOffer(o.id))}
                    disabled={busy}
                    className="mt-2 text-xs text-subtle hover:text-red-500"
                  >
                    Decline this offer
                  </button>
                )}
              </div>
            );
          })}

        {!assigned && ranked.length === 0 && (
          <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
            <p className="text-3xl">⏳</p>
            <p className="mt-2 font-medium text-text">No offers yet</p>
            <p className="mt-1">
              Your post is live in Explore — we&apos;ll notify you the moment a buddy offers.
            </p>
            <Link href="/app/find" className="mt-3 block font-medium text-brand">
              See it in Explore ›
            </Link>
          </div>
        )}

        <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
          💡 Posting is free. Accept a number you like or counter — each side takes turns until you
          shake on a price.
        </p>
      </div>
    </div>
  );
}
