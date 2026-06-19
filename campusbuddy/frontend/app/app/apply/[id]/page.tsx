'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, CURRENT_PROVIDER } from '../../../../lib/mockTasks';
import { formatSgd } from '../../../../lib/format';

// Apply flow with the verification gate:
//  1. Account must be matric-verified (done once at onboarding) for tasks that
//     enter a room / handle belongings. The actual card SCAN happens on arrival
//     (see /app/task/[id]) so a substitute can't be sent in their place.
//  2. Same-gender matching is OPT-IN by the customer for intimate tasks (laundry),
//     matched against the provider's verified profile gender.
export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);

  const matricVerified = CURRENT_PROVIDER.matricVerified;
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app/find" className="text-blue-700">Back to tasks</Link>
      </div>
    );
  }

  const genderBlocked =
    task.sameGenderOnly && CURRENT_PROVIDER.gender !== task.customerGender;
  const needsMatric = task.requiresMatricVerification && !matricVerified;
  const canApply = !genderBlocked && !needsMatric;
  // Provider's own quote — defaults to the listed price until they change it.
  // Paid directly by PayNow/cash on completion, so the buddy collects the full amount.
  const quoteCents =
    quote.trim() === '' ? task.priceCents : Math.max(0, Math.round(Number(quote) * 100));
  const earnings = quoteCents;

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-xl font-bold">Application sent!</h1>
        <p className="mt-2 text-slate-600">
          {task.customerName} will review and confirm. You&apos;ll get a notification if accepted.
        </p>
        <Link
          href={`/app/task/${task.id}`}
          className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white"
        >
          Demo: customer accepted → open task
        </Link>
        <Link href="/app/find" className="mt-3 text-sm text-slate-500">
          Find more tasks
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app/find" className="text-slate-500">‹ </Link> Apply
      </header>

      <div className="space-y-4 p-4">
        {/* Task summary */}
        <div className="rounded-xl border bg-white p-3">
          <div className="flex justify-between">
            <span className="font-medium">{task.icon} {task.title}</span>
            <span className="text-green-700">{formatSgd(task.priceCents)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {task.hall} · {task.when} · {task.customerName} ⭐{task.customerRating}
          </p>
          <p className="mt-2 rounded-lg bg-green-50 px-2 py-1 text-sm text-green-800">
            You collect <b>{formatSgd(earnings)}</b> · PayNow or cash on completion
          </p>
        </div>

        {/* Verification gate */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Verification</p>

          {/* Matric card — account-level status, set once at onboarding */}
          {task.requiresMatricVerification ? (
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">🪪 Matric-verified account</span>
                {matricVerified ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Verified ✓</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Required</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                This task enters a room / handles belongings, so it&apos;s open to matric-verified
                students only.
              </p>
              <p className="mt-2 rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-700">
                📍 On arrival you&apos;ll verify with your NTU pass or a live photo of your matric
                card, so {task.customerName} knows it&apos;s really you — not someone sent in your
                place.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-3 text-sm text-slate-500">
              ✓ No ID scan needed for this task type.
            </div>
          )}

          {/* Same-gender matching */}
          {task.sameGenderOnly && (
            <div
              className={`rounded-xl border p-3 ${
                genderBlocked ? 'border-red-200 bg-red-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {task.customerGender === 'F' ? '♀' : '♂'} Same-gender buddy
                </span>
                {genderBlocked ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Not eligible</span>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Match ✓</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {task.title.toLowerCase().includes('laundry') ? 'Laundry' : 'This task'} involves
                personal items, so {task.customerName} chose a{' '}
                {task.customerGender === 'F' ? 'female' : 'male'} buddy.
                {genderBlocked
                  ? ' Your profile doesn’t match, so this one’s not open to you — but most tasks are.'
                  : ' Your verified profile matches.'}
              </p>
            </div>
          )}
        </div>

        {/* Your quote — open bidding */}
        {canApply && (
          <label className="block text-sm">
            <span className="text-slate-500">Your price (SGD)</span>
            <input
              type="number"
              inputMode="decimal"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder={(task.priceCents / 100).toFixed(2)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
            <span className="mt-1 block text-xs text-slate-400">
              {task.customerName} listed {formatSgd(task.priceCents)} — offer your own price, higher
              or lower. You collect <b>{formatSgd(earnings)}</b> directly (PayNow or cash).
            </span>
          </label>
        )}

        {/* Application message */}
        {canApply && (
          <label className="block text-sm">
            <span className="text-slate-500">Message to {task.customerName} (optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Hi! I can do this right after my 4pm class."
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
        )}

        {/* Submit */}
        <button
          onClick={() => setSubmitted(true)}
          disabled={!canApply}
          className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {genderBlocked
            ? 'Not eligible for this task'
            : needsMatric
              ? 'Verify account to continue'
              : `Send application · ${formatSgd(quoteCents)}`}
        </button>
      </div>
    </div>
  );
}
