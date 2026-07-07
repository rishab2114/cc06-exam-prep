'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { feeBreakdown, formatSgd } from '../../../../lib/format';
import { parseSgdToCents } from '../../../../lib/store';
import { api, ApiClientError, type ApiTask } from '../../../../lib/api';

// Offer flow (provider side). Your quote opens a real negotiation thread with
// the poster — they can accept it or counter, and you continue on the task page.
// Safety rails shown up front: matric verification happens at arrival (so a
// substitute can't be sent), contactless/in-person rules per category, and the
// academic-integrity pledge for study help.
export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();

  const [task, setTask] = useState<ApiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState('');
  const [custom, setCustom] = useState(false); // false = one-tap at asking price
  const [integrityOk, setIntegrityOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .task(id)
      .then((r) => setTask(r.task))
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading task…</div>;
  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app/find" className="text-blue-700">Back to tasks</Link>
      </div>
    );
  }

  const notOpen = task.status !== 'OPEN';
  const ownTask = task.isMine;
  const needsIntegrity = task.category === 'Study help' && !integrityOk;
  const canApply = !ownTask && !notOpen && !needsIntegrity;
  // Provider's own quote — defaults to the listed price until they change it.
  // Safe parse: empty -> listed price; junk/zero -> 0 (blocks submit below).
  const quoteCents = quote.trim() === '' ? task.priceCents : parseSgdToCents(quote);
  const invalidQuote = quote.trim() !== '' && quoteCents <= 0;
  const earnings = feeBreakdown(quoteCents).buddyGets;

  // One-tap passes the asking price explicitly; the custom form passes nothing
  // and uses the typed quote. Message only rides along in custom mode.
  async function submit(cents?: number) {
    if (!canApply || submitting || !task) return;
    const amount = cents ?? quoteCents;
    if (amount <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.makeOffer(task.id, amount, custom ? message : undefined);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not send your offer — try again.');
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-xl font-bold">Offer sent — {formatSgd(quoteCents)}!</h1>
        <p className="mt-2 text-slate-600">
          {task.customerName} can accept your price or counter. We&apos;ll notify you the moment they
          respond.
        </p>
        <Link
          href={`/app/task/${task.id}`}
          className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white"
        >
          Track your offer ›
        </Link>
        <Link href="/app/find" className="mt-3 text-sm text-slate-500">
          Find more tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app/find" className="text-slate-500">‹ </Link> Offer to help
      </header>

      <div className="space-y-4 p-4">
        {/* Task summary */}
        <div className="rounded-xl border bg-white p-3">
          <div className="flex justify-between">
            <span className="font-medium">{task.icon} {task.title}</span>
            <span className="text-green-700">{formatSgd(task.priceCents)}{task.study ? '/hr' : ''}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {task.hall} · {task.when} · {task.customerName}
          </p>
          {task.description && task.description !== task.title && (
            <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-sm text-slate-600">“{task.description}”</p>
          )}
          <p className="mt-2 rounded-lg bg-green-50 px-2 py-1 text-sm text-green-800">
            You earn <b>{formatSgd(earnings)}</b>
          </p>
        </div>

        {ownTask && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            This is your own post — you can&apos;t offer on it.{' '}
            <Link href={`/app/applicants/${task.id}`} className="font-medium underline">See your offers ›</Link>
          </p>
        )}
        {notOpen && !ownTask && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            This task is no longer taking offers.
          </p>
        )}

        {/* Structured study request — what exactly they need help with */}
        {task.study && (
          <div className="rounded-xl border bg-white p-3">
            <p className="font-medium">📖 {task.study.module}</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <p><span className="text-slate-400">Topics:</span> {task.study.topics.join(', ')}</p>
              <p><span className="text-slate-400">Level:</span> {task.study.level}</p>
              <p><span className="text-slate-400">Goal:</span> {task.study.goal}</p>
              <p><span className="text-slate-400">Format:</span> {task.study.format}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {task.study.helpTypes.map((h) => (
                <span key={h} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Academic-integrity guardrail for study help / tutoring */}
        {task.category === 'Study help' && !ownTask && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="font-medium text-amber-800">📚 Study help — keep it honest</p>
            <p className="mt-1 text-sm text-amber-700">
              Explain concepts, work through practice questions, and help {task.customerName} prep.
              You must <b>not</b> do their assignments, write their essays, or sit exams for them —
              that&apos;s contract cheating and gets both accounts banned.
            </p>
            <label className="mt-2 flex items-start gap-2 text-xs text-amber-800">
              <input
                type="checkbox"
                checked={integrityOk}
                onChange={(e) => setIntegrityOk(e.target.checked)}
                className="mt-0.5"
              />
              I&apos;ll tutor and explain only — no doing the work for them.
            </label>
          </div>
        )}

        {/* Safety rails for this task type */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-slate-500">How this task works</p>

          {task.requiresMatricVerification && (
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">🪪 Verify on arrival</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Campus email ✓</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                This task enters a room / handles belongings, so at the door you&apos;ll confirm your
                identity with {task.customerName} — the buddy they accepted is the one who shows up.
                (Live matric-card scan is coming with the verification launch.)
              </p>
            </div>
          )}

          {task.contactless && (
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">📦 Contactless</span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">No room entry</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {task.customerName} leaves the bag outside the door. You pick it up and send live
                status updates (like Grab) — picked up, washing, on the way back.
              </p>
            </div>
          )}

          {task.presenceRequired && (
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">👥 Done with {task.customerName} present</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">In person</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                For safety, this task is done while {task.customerName} is in the room — you&apos;re
                never working alone in someone&apos;s space.
              </p>
            </div>
          )}
        </div>

        {/* Primary path: one tap to offer at the asking price. Haggling is a
            deliberate second step so the common case is frictionless. */}
        {canApply && !custom && (
          <div className="space-y-2">
            <button
              onClick={() => void submit(task.priceCents)}
              disabled={submitting}
              className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Sending offer…' : `Offer to help — ${formatSgd(task.priceCents)}`}
            </button>
            <p className="text-center text-xs text-slate-400">
              You earn <b>{formatSgd(feeBreakdown(task.priceCents).buddyGets)}</b> · {task.customerName}’s asking price
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={() => { setCustom(true); setQuote((task.priceCents / 100).toFixed(2)); }}
              className="block w-full py-1 text-center text-sm font-medium text-blue-700"
            >
              or name your own price ›
            </button>
          </div>
        )}

        {/* Secondary path: custom price + a note to the poster */}
        {canApply && custom && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-500">Your price (SGD)</span>
              <input
                type="number"
                inputMode="decimal"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder={(task.priceCents / 100).toFixed(2)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                autoFocus
              />
              <span className={`mt-1 block text-xs ${invalidQuote ? 'text-red-500' : 'text-slate-400'}`}>
                {invalidQuote
                  ? 'That price doesn’t look right — enter a number above S$0.'
                  : <>{task.customerName} listed {formatSgd(task.priceCents)} — offer higher or lower. You earn <b>{formatSgd(earnings)}</b>.</>}
              </span>
            </label>

            <label className="block text-sm">
              <span className="text-slate-500">Message to {task.customerName} (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Hi! I can do this right after my 4pm class."
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={() => void submit()}
              disabled={invalidQuote || submitting}
              className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Sending offer…' : invalidQuote ? 'Fix your price to continue' : `Send offer · ${formatSgd(quoteCents)}`}
            </button>
            <button onClick={() => setCustom(false)} className="block w-full text-center text-xs text-slate-400">
              ‹ Back to one-tap at {formatSgd(task.priceCents)}
            </button>
          </div>
        )}

        {/* Can't offer (own task / closed / integrity pledge) */}
        {!canApply && (
          <button
            disabled
            className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white opacity-50"
          >
            {ownTask
              ? 'This is your own task'
              : notOpen
                ? 'No longer taking offers'
                : 'Tick the tutoring pledge to continue'}
          </button>
        )}
      </div>
    </div>
  );
}
