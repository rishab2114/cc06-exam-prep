'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getTask, applicantsFor } from '../../../../lib/mockTasks';
import { formatSgd } from '../../../../lib/format';

// Customer view: applicants + BARGAINING. Each buddy has a live number on the
// table (starts at their quote). The customer can Accept it or Counter. A counter
// is simulated: within ~10% of the buddy's price they accept; otherwise they
// counter back at the midpoint, and you can accept or counter again. Fully
// client-side so the negotiation UX is testable without a backend.
type Phase = 'open' | 'theyCountered' | 'agreed';
type Nego = { current: number; phase: Phase; note?: string };

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);
  const applicants = applicantsFor(id);

  const [nego, setNego] = useState<Record<string, Nego>>({});
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterVal, setCounterVal] = useState('');

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app" className="text-blue-700">Home</Link>
      </div>
    );
  }

  const ranked = [...applicants].sort((a, b) => a.quoteCents - b.quoteCents);
  const stateFor = (aid: string, quote: number): Nego =>
    nego[aid] ?? { current: quote, phase: 'open' };

  function openCounter(aid: string, current: number) {
    setCounterOpen(aid);
    // pre-fill a sensible offer: midpoint between the listed budget and their number
    setCounterVal(String(Math.round((current / 100 + task!.priceCents / 100) / 2)));
  }

  function submitCounter(aid: string, quote: number) {
    const cur = stateFor(aid, quote).current;
    const offerCents = Math.max(0, Math.round(Number(counterVal) * 100));
    setCounterOpen(null);
    if (offerCents >= Math.round(cur * 0.9)) {
      setNego((n) => ({ ...n, [aid]: { current: offerCents, phase: 'agreed', note: 'accepted your offer 🎉' } }));
    } else {
      const meet = Math.round((offerCents + cur) / 2);
      setNego((n) => ({ ...n, [aid]: { current: meet, phase: 'theyCountered', note: 'countered back' } }));
    }
  }

  function accept(aid: string, price: number) {
    setNego((n) => ({ ...n, [aid]: { current: price, phase: 'agreed', note: 'deal 🤝' } }));
  }

  return (
    <div>
      <header className="border-b bg-white px-4 py-3">
        <span className="font-semibold">
          <Link href="/app" className="text-slate-500">‹ </Link>
          {task.icon} {task.title}
        </span>
        <p className="mt-1 text-sm text-slate-500">
          You listed {formatSgd(task.priceCents)} · {applicants.length} applicants · accept a price
          or bargain
        </p>
      </header>

      <div className="space-y-3 p-4">
        {ranked.map((a) => {
          const s = stateFor(a.id, a.quoteCents);
          const diff = s.current - task.priceCents;
          const agreed = s.phase === 'agreed';
          return (
            <div key={a.id} className={`rounded-xl border bg-white p-3 ${agreed ? 'border-green-300' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {a.name}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      ⭐{a.rating} · {a.completedJobs} jobs
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.matricVerified && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">🪪 Verified</span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">⏱ ~{a.etaMins} min</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-700">{formatSgd(s.current)}</p>
                  <p className="text-xs text-slate-400">
                    {diff === 0 ? 'at your budget' : diff > 0 ? `+${formatSgd(diff)}` : `−${formatSgd(-diff)}`}
                    {s.phase !== 'open' && s.note ? ` · ${a.name} ${s.note}` : ''}
                  </p>
                </div>
              </div>

              <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 text-sm text-slate-600">“{a.message}”</p>

              {agreed ? (
                <Link
                  href={`/app/task/${task.id}`}
                  className="mt-2 block rounded-lg bg-green-600 py-2 text-center text-sm font-medium text-white"
                >
                  ✓ Agreed at {formatSgd(s.current)} — start task with {a.name}
                </Link>
              ) : counterOpen === a.id ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-500">Offer S$</span>
                  <input
                    type="number"
                    value={counterVal}
                    onChange={(e) => setCounterVal(e.target.value)}
                    className="w-20 rounded-lg border px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => submitCounter(a.id, a.quoteCents)}
                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Send offer
                  </button>
                  <button onClick={() => setCounterOpen(null)} className="text-sm text-slate-400">Cancel</button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => accept(a.id, s.current)}
                    className="flex-1 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white"
                  >
                    Accept {formatSgd(s.current)}
                  </button>
                  <button
                    onClick={() => openCounter(a.id, s.current)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    {s.phase === 'theyCountered' ? 'Counter again' : 'Bargain'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {ranked.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">No applicants yet — hang tight!</p>
        )}

        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          💡 Posting is free. You only pay once you accept a buddy — we hold the agreed amount and
          refund anything unused back to your CampusBuddy balance.
        </p>
      </div>
    </div>
  );
}
