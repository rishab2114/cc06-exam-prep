'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, CURRENT_PROVIDER } from '../../../../lib/mockTasks';
import { feeBreakdown, formatSgd } from '../../../../lib/format';

// Apply flow with the verification gate (the feature requested in chat):
//  1. Matric-card check for tasks that enter private space / handle belongings.
//     The matric NUMBER is never shown to anyone — scanning only returns a
//     verified=true result (privacy-by-design).
//  2. Same-gender matching for intimate tasks (laundry), based on the provider's
//     verified profile gender. Framed as a customer comfort preference.
export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);

  const [matricVerified, setMatricVerified] = useState(CURRENT_PROVIDER.matricVerified);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
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
  const earnings = feeBreakdown(task.priceCents).buddyGets;

  function scanCard() {
    setScanning(true);
    // Simulates tapping the matric card on NFC / scanning the QR. The real app
    // calls the verification service which returns only a boolean + signed token.
    setTimeout(() => {
      setMatricVerified(true);
      setScanning(false);
    }, 900);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-xl font-bold">Application sent!</h1>
        <p className="mt-2 text-slate-600">
          {task.customerName} will review and confirm. You&apos;ll get a notification if accepted.
        </p>
        <Link href="/app/find" className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white">
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
            You earn <b>{formatSgd(earnings)}</b> after the 15% platform fee
          </p>
        </div>

        {/* Verification gate */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Verification</p>

          {/* Matric card */}
          {task.requiresMatricVerification ? (
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">🪪 Matric card</span>
                {matricVerified ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Verified ✓</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Required</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                This task involves entering a room / handling belongings, so we confirm you&apos;re a
                real NTU student.
              </p>
              {!matricVerified && (
                <button
                  onClick={scanCard}
                  disabled={scanning}
                  className="mt-2 w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {scanning ? 'Scanning…' : 'Scan matric card'}
                </button>
              )}
              <p className="mt-2 text-xs text-slate-400">
                🔒 Your matric number is encrypted and never shown — not to the customer, not to
                you. Scanning only confirms “verified”.
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
              ? 'Scan matric card to continue'
              : 'Send application'}
        </button>
      </div>
    </div>
  );
}
