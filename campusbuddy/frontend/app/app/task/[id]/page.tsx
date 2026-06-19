'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, CURRENT_PROVIDER } from '../../../../lib/mockTasks';
import { feeBreakdown, formatSgd } from '../../../../lib/format';

// Active (accepted) task — provider side. Arrival check-in confirms the assigned
// buddy is the one who showed up, via one of two methods:
//   - NTU pass: re-auth with NTU SSO; the returned identity must equal the
//     assigned buddy.
//   - Live matric photo: card is photographed IN-APP on the spot (no gallery
//     uploads), then OCR + face/name match against the onboarding record.
// Either way, an identity that isn't the assigned buddy is rejected and the
// customer is alerted — so nobody can send a substitute. Matric number is never shown.
type Method = null | 'ntupass' | 'photo';
type Status = 'idle' | 'verifying' | 'confirmed' | 'mismatch';

export default function ActiveTaskPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);
  const [method, setMethod] = useState<Method>(null);
  const [status, setStatus] = useState<Status>('idle');

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app/find" className="text-blue-700">Back to tasks</Link>
      </div>
    );
  }

  const earnings = feeBreakdown(task.priceCents).buddyGets;

  // mine = the assigned buddy verifies as themselves -> match. Anything else is a
  // substitute and gets caught.
  function verify(mine: boolean) {
    setStatus('verifying');
    setTimeout(() => setStatus(mine ? 'confirmed' : 'mismatch'), 900);
  }

  function reset() {
    setMethod(null);
    setStatus('idle');
  }

  const done = status === 'confirmed';

  return (
    <div>
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            <Link href="/app/find" className="text-slate-500">‹ </Link>
            {task.icon} {task.title}
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">ASSIGNED</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {task.hall} · with {task.customerName} ⭐{task.customerRating} · you earn{' '}
          {formatSgd(earnings)}
        </p>
      </header>

      <div className="space-y-4 p-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="font-medium">📍 Arrival check-in</p>
          <p className="mt-1 text-sm text-slate-500">
            At {task.customerName}&apos;s door, verify it&apos;s really you so the buddy they
            accepted is the one who showed up.
          </p>

          {/* Result banners */}
          {status === 'confirmed' && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              ✅ <b>Identity confirmed — {CURRENT_PROVIDER.name}.</b> {task.customerName} now sees:
              “Your buddy is verified and has arrived.”
            </div>
          )}
          {status === 'mismatch' && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              🚫 <b>This isn&apos;t the assigned buddy.</b> Check-in blocked and {task.customerName}{' '}
              has been alerted. Only {CURRENT_PROVIDER.name} can check in for this task.
              <button onClick={reset} className="mt-2 block font-medium underline">Try again</button>
            </div>
          )}

          {/* Step 1: choose a method */}
          {method === null && status === 'idle' && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setMethod('ntupass')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium"
              >
                <span>🎓 Verify with NTU pass</span><span className="text-slate-400">›</span>
              </button>
              <button
                onClick={() => setMethod('photo')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium"
              >
                <span>📷 Photo of matric card</span><span className="text-slate-400">›</span>
              </button>
            </div>
          )}

          {/* Step 2a: NTU pass */}
          {method === 'ntupass' && status !== 'confirmed' && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-500">Sign in with NTU SSO to confirm your identity.</p>
              <button
                onClick={() => verify(true)}
                disabled={status === 'verifying'}
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {status === 'verifying' ? 'Verifying…' : `Continue as ${CURRENT_PROVIDER.name}`}
              </button>
              <button
                onClick={() => verify(false)}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600"
              >
                Demo: sign in as someone else
              </button>
            </div>
          )}

          {/* Step 2b: live photo capture */}
          {method === 'photo' && status !== 'confirmed' && (
            <div className="mt-3 space-y-2">
              <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-3xl">
                {status === 'verifying' ? '⏳' : '📷'}
              </div>
              <p className="text-xs text-slate-400">
                Taken live in the app — no gallery uploads — so the card is checked on the spot.
              </p>
              <button
                onClick={() => verify(true)}
                disabled={status === 'verifying'}
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {status === 'verifying' ? 'Verifying card…' : 'Capture my matric card'}
              </button>
              <button
                onClick={() => verify(false)}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600"
              >
                Demo: capture a different card
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            🔒 The matric number is never shown — verification only returns an identity match.
          </p>
        </div>

        {/* Task actions unlock only after a confirmed check-in */}
        <button
          disabled={!done}
          className="block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? 'Mark task complete' : 'Check in to start the task'}
        </button>
      </div>
    </div>
  );
}
