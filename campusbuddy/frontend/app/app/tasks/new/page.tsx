'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatSgd } from '../../../../lib/format';

// Create-task form (wireframe #3, docs/05). No min budget; buddies can also quote.
const CATEGORIES = ['Room cleaning', 'Laundry pickup', 'Spare home-cooked meal', 'Grocery shopping', 'Food delivery', 'Parcel collection', 'Room shift & storage', 'Study help / tutoring', 'Late-night food run'];
// Stores for grocery/delivery runs — buddy shops/picks up from here.
const STORES = ['Any store', '7-Eleven / Prime', 'FairPrice', 'Cheers', 'Amazon / Prime Now'];

// Maps the home quick-post slugs to a category so the dropdown preselects correctly.
const SLUG_TO_CATEGORY: Record<string, string> = {
  'room-cleaning': 'Room cleaning',
  'laundry-pickup': 'Laundry pickup',
  'spare-meal': 'Spare home-cooked meal',
  'grocery-shopping': 'Grocery shopping',
  'food-delivery': 'Food delivery',
  'parcel-collection': 'Parcel collection',
  'room-move': 'Room shift & storage',
  'study-help': 'Study help / tutoring',
  'late-night-food-run': 'Late-night food run',
};

function NewTaskForm() {
  const params = useSearchParams();
  const initialCategory = SLUG_TO_CATEGORY[params.get('category') ?? ''] ?? CATEGORIES[0];
  const storeParam = params.get('store');
  const initialStore =
    storeParam === 'convenience'
      ? '7-Eleven / Prime'
      : STORES.includes(storeParam ?? '')
        ? (storeParam as string)
        : 'Any store';

  const [category, setCategory] = useState(initialCategory);
  const [store, setStore] = useState(initialStore);
  const [budget, setBudget] = useState(20);
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
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
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

        <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
          You pay <b>{formatSgd(cents)}</b>
        </div>

        <button className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white">
          Continue to payment
        </button>
      </form>
    </div>
  );
}

export default function NewTaskPage() {
  // useSearchParams must be inside a Suspense boundary for static rendering.
  return (
    <Suspense>
      <NewTaskForm />
    </Suspense>
  );
}
