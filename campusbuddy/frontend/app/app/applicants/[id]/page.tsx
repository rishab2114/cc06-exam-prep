'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTask, applicantsFor } from '../../../../lib/mockTasks';
import { feeBreakdown, formatSgd } from '../../../../lib/format';

// Customer view: the people who applied to my task, each with THEIR quote. Open
// bidding — quotes can be above or below the listed budget. The customer picks on
// price + rating + ETA. Accepting a buddy assigns them and opens the task.
export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTask(id);
  const applicants = applicantsFor(id);

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-500">
        Task not found. <Link href="/app" className="text-blue-700">Home</Link>
      </div>
    );
  }

  // Cheapest first, but every quote is shown so the customer can weigh rating/ETA.
  const ranked = [...applicants].sort((a, b) => a.quoteCents - b.quoteCents);

  return (
    <div>
      <header className="border-b bg-white px-4 py-3">
        <span className="font-semibold">
          <Link href="/app" className="text-slate-500">‹ </Link>
          {task.icon} {task.title}
        </span>
        <p className="mt-1 text-sm text-slate-500">
          You listed {formatSgd(task.priceCents)} · {applicants.length} applicants · pick who you
          want
        </p>
      </header>

      <div className="space-y-3 p-4">
        {ranked.map((a) => {
          const youPay = a.quoteCents;
          const diff = a.quoteCents - task.priceCents;
          return (
            <div key={a.id} className="rounded-xl border bg-white p-3">
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
                  <p className="text-lg font-semibold text-green-700">{formatSgd(a.quoteCents)}</p>
                  <p className="text-xs text-slate-400">
                    {diff === 0 ? 'at your budget' : diff > 0 ? `+${formatSgd(diff)}` : `−${formatSgd(-diff)}`}
                  </p>
                </div>
              </div>

              <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 text-sm text-slate-600">
                “{a.message}”
              </p>

              <p className="mt-2 text-xs text-slate-400">
                You pay {formatSgd(youPay)} · buddy gets {formatSgd(feeBreakdown(youPay).buddyGets)} after fee
              </p>

              <Link
                href={`/app/task/${task.id}`}
                className="mt-2 block rounded-lg bg-blue-700 py-2 text-center text-sm font-medium text-white"
              >
                Accept {a.name} · {formatSgd(a.quoteCents)}
              </Link>
            </div>
          );
        })}

        {ranked.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">No applicants yet — hang tight!</p>
        )}
      </div>
    </div>
  );
}
