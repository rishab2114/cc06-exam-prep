'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, CURRENT_PROVIDER } from '../../../../lib/mockTasks';
import { feeBreakdown, formatSgd } from '../../../../lib/format';

// Active (accepted) task — provider side. The key control here is the ARRIVAL
// CHECK-IN scan: when the buddy reaches the door, they scan their matric card and
// the system confirms the scanned identity matches the ASSIGNED provider. If a
// different person scans, it's rejected and the customer is alerted — this stops
// someone sending a substitute. The matric number itself is never displayed.
type ScanState = 'idle' | 'scanning' | 'confirmed' | 'mismatch';

export default function ActiveTaskPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);
  const [scan, setScan] = useState<ScanState>('idle');

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app/find" className="text-blue-700">Back to tasks</Link>
      </div>
    );
  }

  const earnings = feeBreakdown(task.priceCents).buddyGets;

  // `mine` = the assigned buddy scanning their own card -> match.
  // anything else -> mismatch (substitute caught).
  function runScan(mine: boolean) {
    setScan('scanning');
    setTimeout(() => setScan(mine ? 'confirmed' : 'mismatch'), 900);
  }

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
        {/* Arrival check-in */}
        <div className="rounded-xl border bg-white p-4">
          <p className="font-medium">📍 Arrival check-in</p>
          <p className="mt-1 text-sm text-slate-500">
            When you reach {task.customerName}&apos;s door, scan your matric card so they can
            confirm the buddy they accepted is the one who showed up.
          </p>

          {scan === 'confirmed' && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              ✅ <b>Identity confirmed — {CURRENT_PROVIDER.name}.</b> {task.customerName} now sees:
              “Your buddy is verified and has arrived.”
            </div>
          )}

          {scan === 'mismatch' && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              🚫 <b>Card doesn&apos;t match the assigned buddy.</b> Check-in blocked and
              {' '}{task.customerName} has been alerted. A different person can&apos;t take over a
              task — only {CURRENT_PROVIDER.name} can check in here.
            </div>
          )}

          {(scan === 'idle' || scan === 'mismatch') && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => runScan(true)}
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white"
              >
                Scan my card ({CURRENT_PROVIDER.name})
              </button>
              <button
                onClick={() => runScan(false)}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600"
              >
                Demo: scan someone else&apos;s card
              </button>
            </div>
          )}

          {scan === 'scanning' && <p className="mt-3 text-sm text-slate-500">Scanning…</p>}

          <p className="mt-3 text-xs text-slate-400">
            🔒 The matric number is never shown — the scan only returns a verified identity match.
          </p>
        </div>

        {/* Task actions unlock only after a confirmed check-in */}
        <button
          disabled={scan !== 'confirmed'}
          className="block w-full rounded-xl bg-green-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scan === 'confirmed' ? 'Mark task complete' : 'Check in to start the task'}
        </button>
      </div>
    </div>
  );
}
