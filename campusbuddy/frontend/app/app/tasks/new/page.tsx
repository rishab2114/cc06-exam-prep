'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatSgd } from '../../../../lib/format';

// Create-task form (wireframe #3, docs/05). No upfront/escrow payment — the
// customer pays the buddy directly on completion via PayNow or cash.
const CATEGORIES = ['Room cleaning', 'Laundry pickup', 'Grocery shopping', 'Food delivery', 'Parcel collection', 'Late-night food run'];
// Stores for grocery/delivery runs — buddy shops/picks up from here.
const STORES = ['Any store', '7-Eleven / Prime', 'FairPrice', 'Cheers', 'Amazon / Prime Now'];

export default function NewTaskPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState(20);
  const [pay, setPay] = useState<'PayNow' | 'Cash'>('PayNow');
  const cents = Math.round(budget * 100);
  const isGrocery = category === 'Grocery shopping' || category === 'Food delivery';

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> New task
      </header>

      <form className="space-y-4 p-4 text-sm" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-slate-500">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        {isGrocery && (
          <label className="block">
            <span className="text-slate-500">Store</span>
            <select className="mt-1 w-full rounded-xl border px-3 py-2">
              {STORES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}

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
            min={0}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-400">
            No minimum — set any budget. Buddies can also offer their own price.
          </span>
        </label>

        <div>
          <span className="text-slate-500">How you&apos;ll pay (on completion)</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(['PayNow', 'Cash'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPay(m)}
                className={`rounded-xl border py-2 font-medium ${
                  pay === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300'
                }`}
              >
                {m === 'PayNow' ? '📲 PayNow' : '💵 Cash'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
          Pay <b>{formatSgd(cents)}</b> directly to your buddy by <b>{pay}</b> when the task is done.
          <span className="mt-1 block text-xs text-blue-500">No upfront charge — nothing is held by the app.</span>
        </div>

        <button className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white">
          Post task
        </button>
      </form>
    </div>
  );
}
