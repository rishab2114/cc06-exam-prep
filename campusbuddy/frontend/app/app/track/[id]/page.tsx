'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, LAUNDRY_STEPS } from '../../../../lib/mockTasks';

// Customer-side live tracking — the other half of the Grab-style flow. The buddy
// advances the status on their task screen; here the customer watches it move and
// gets each update. In the demo it auto-advances every few seconds to feel live.
const BUDDY = { name: 'Aisha', rating: 4.9 };

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);
  const [step, setStep] = useState(1); // start mid-flow so it looks "in progress"

  const total = LAUNDRY_STEPS.length;
  useEffect(() => {
    if (step >= total) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, total)), 3000);
    return () => clearTimeout(t);
  }, [step, total]);

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app" className="text-blue-700">Home</Link>
      </div>
    );
  }

  const doneAll = step >= total;
  const current = doneAll ? LAUNDRY_STEPS[total - 1] : LAUNDRY_STEPS[step];
  const latest = step > 0 ? LAUNDRY_STEPS[step - 1] : null;

  return (
    <div>
      <header className="border-b bg-white px-4 py-3">
        <span className="font-semibold">
          <Link href="/app" className="text-slate-500">‹ </Link>
          {task.icon} {task.title}
        </span>
        <p className="mt-1 text-sm text-slate-500">
          Your buddy {BUDDY.name} ⭐{BUDDY.rating} · {task.hall}
        </p>
      </header>

      <div className="space-y-4 p-4">
        {/* Live status banner — like Grab's "your order is…" */}
        <div className={`rounded-xl p-4 ${doneAll ? 'bg-green-50 text-green-800' : 'bg-blue-600 text-white'}`}>
          <p className="text-xs uppercase tracking-wide opacity-80">
            {doneAll ? 'Completed' : 'Live'}
          </p>
          <p className="mt-1 text-lg font-semibold">
            {doneAll ? '✅ Delivered to your door' : current.label}
          </p>
          {latest && <p className="mt-1 text-sm opacity-90">{latest.text}</p>}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border bg-white p-4">
          <ol className="space-y-3">
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
        </div>

        {doneAll ? (
          <button className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white">
            Rate {BUDDY.name}
          </button>
        ) : (
          <button className="block w-full rounded-xl border border-slate-300 py-3 font-medium text-slate-600">
            Message {BUDDY.name}
          </button>
        )}
      </div>
    </div>
  );
}
