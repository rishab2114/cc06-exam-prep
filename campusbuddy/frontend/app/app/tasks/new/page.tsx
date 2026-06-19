'use client';

import { useState } from 'react';
import Link from 'next/link';
import { feeBreakdown, formatSgd } from '../../../../lib/format';

// Create-task form (wireframe #3, docs/05). Shows the live "you pay / buddy gets"
// breakdown using the shared fee math (15% + S$1 floor) from lib/format.ts.
const CATEGORIES = ['Room cleaning', 'Laundry pickup', 'Grocery shopping', 'Parcel collection', 'Late-night food run'];

export default function NewTaskPage() {
  const [budget, setBudget] = useState(20);
  const cents = Math.round(budget * 100);
  const { youPay, platformFee, buddyGets } = feeBreakdown(cents);

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> New task
      </header>

      <form className="space-y-4 p-4 text-sm" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-slate-500">Category</span>
          <select className="mt-1 w-full rounded-xl border px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-slate-500">What do you need?</span>
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} placeholder="Clean my room before block inspection..." />
        </label>

        <label className="block">
          <span className="text-slate-500">Where</span>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="Hall 9, Blk 51" />
        </label>

        <div className="flex gap-2">
          <label className="block flex-1"><span className="text-slate-500">When</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="Today" /></label>
          <label className="block flex-1"><span className="text-slate-500">Time</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="6–8pm" /></label>
        </div>

        <label className="block">
          <span className="text-slate-500">Budget (SGD)</span>
          <input
            type="number"
            min={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
          You pay <b>{formatSgd(youPay)}</b> · Buddy gets <b>{formatSgd(buddyGets)}</b>{' '}
          <span className="text-blue-500">(platform fee {formatSgd(platformFee)})</span>
        </div>

        <button className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white">
          Continue to payment
        </button>
      </form>
    </div>
  );
}
