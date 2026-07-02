import Link from 'next/link';
import { CURRENT_PROVIDER, WALLET_HISTORY } from '../../../lib/mockTasks';
import { formatSgd } from '../../../lib/format';

// Earnings / wallet (wireframe #6, docs/05). Mock data; payouts run through Stripe
// Connect in production.
export default function WalletPage() {
  const p = CURRENT_PROVIDER;
  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">Earnings</header>

      <div className="space-y-4 p-4">
        {/* Balance card */}
        <div className="rounded-2xl bg-blue-700 p-4 text-white">
          <p className="text-sm text-blue-100">Available to withdraw</p>
          <p className="mt-1 text-3xl font-bold">{formatSgd(p.availableCents)}</p>
          <p className="mt-1 text-sm text-blue-100">This month: {formatSgd(p.monthCents)}</p>
        </div>

        <details className="group rounded-xl border bg-white px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
            <span>💳 Manage payouts</span>
            <span className="text-slate-300 group-open:rotate-90">›</span>
          </summary>
          <p className="mt-2 text-xs text-slate-500">
            Payouts run to your bank via Stripe. Connect your account to withdraw — coming with the
            payments launch.
          </p>
        </details>

        {/* History */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Recent activity</p>
          <div className="divide-y overflow-hidden rounded-xl border bg-white text-sm">
            {WALLET_HISTORY.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{h.label}</p>
                  <p className="text-xs text-slate-400">{h.date}</p>
                </div>
                <span className={h.deltaCents >= 0 ? 'font-medium text-green-700' : 'text-slate-500'}>
                  {h.deltaCents >= 0 ? '+' : '−'}{formatSgd(Math.abs(h.deltaCents))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Link href="/app/find" className="block rounded-xl bg-blue-700 py-3 text-center font-medium text-white">
          Find tasks to earn more
        </Link>
      </div>
    </div>
  );
}
