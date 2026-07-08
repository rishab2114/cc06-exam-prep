'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatSgd } from '../../../lib/format';
import { api, type ApiTask } from '../../../lib/api';

// History — every past task you were part of, either side (poster or buddy).
// This is where completed work, cancellations, and the reviews around them
// live, so nothing "disappears" from the product once it's done.
const CHIP: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: '✓ COMPLETED', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '✕ CANCELLED', cls: 'bg-slate-100 text-slate-500' },
  DISPUTED: { label: '⚠ IN REVIEW', cls: 'bg-red-100 text-red-700' },
};

export default function HistoryPage() {
  const [tasks, setTasks] = useState<ApiTask[] | null>(null);

  useEffect(() => {
    api
      .historyTasks()
      .then((r) => setTasks(r.tasks))
      .catch(() => setTasks([]));
  }, []);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> History
      </header>

      <div className="space-y-2 p-4">
        {tasks === null && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border bg-white" />
            ))}
          </div>
        )}

        {tasks?.map((t) => {
          const chip = CHIP[t.status] ?? CHIP.CANCELLED;
          // Completed tasks link to where the reviews live for your role.
          const href = t.isMine ? `/app/applicants/${t.id}` : `/app/task/${t.id}`;
          return (
            <Link key={t.id} href={href} className="block rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium"><span aria-hidden="true">{t.icon}</span> {t.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${chip.cls}`}>{chip.label}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatSgd(t.priceCents)}{t.study ? '/hr' : ''} · {t.when} ·{' '}
                {t.isMine ? 'you posted this' : `you helped ${t.customerName}`}
              </p>
              {t.status === 'COMPLETED' && (
                <p className="mt-1 text-sm text-blue-700">View reviews ›</p>
              )}
            </Link>
          );
        })}

        {tasks?.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            <p className="text-3xl">🕘</p>
            <p className="mt-2 font-medium text-slate-700">No past tasks yet</p>
            <p className="mt-1">Completed and cancelled tasks land here, along with their reviews.</p>
            <Link href="/app/find" className="mt-3 block font-medium text-blue-700">Browse open tasks ›</Link>
          </div>
        )}
      </div>
    </div>
  );
}
