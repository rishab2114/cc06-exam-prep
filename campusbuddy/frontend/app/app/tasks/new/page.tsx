'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatSgd } from '../../../../lib/format';

// Create-task form (wireframe #3, docs/05). No min budget; buddies can also quote.
// Study help gets its OWN structured form (module/topics/level/goal/help type) —
// not the generic job fields — so tutors can self-select accurately.
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

const LEVELS = ['Starting from basics', 'Intermediate', 'Advanced'] as const;
const HELP_TYPES = [
  { key: 'concepts', label: '💡 Explain concepts' },
  { key: 'tutorials', label: '📝 Walk through tutorials' },
  { key: 'pastpapers', label: '📄 Past-paper practice' },
  { key: 'examplan', label: '🎯 Exam revision plan' },
] as const;
const FORMATS = ['📍 In person (library)', '💻 Online'] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-slate-300 bg-white'
      }`}
    >
      {children}
    </button>
  );
}

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

  // Study-help fields
  const [module, setModule] = useState('');
  const [topics, setTopics] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Intermediate');
  const [helpTypes, setHelpTypes] = useState<string[]>(['concepts']);
  const [goal, setGoal] = useState('');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[0]);

  const cents = Math.round(budget * 100);
  const isGrocery = category === 'Grocery shopping' || category === 'Food delivery';
  const isStudy = category === 'Study help / tutoring';

  function toggleHelpType(key: string) {
    setHelpTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link>
        {isStudy ? 'Get study help' : 'New task'}
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

        {isStudy ? (
          /* ---------- Structured study-help request ---------- */
          <>
            <label className="block">
              <span className="text-slate-500">Module</span>
              <input
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. MH1810 — Calculus I"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-slate-500">Topic areas</span>
              <input
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. Integration, limits, Taylor series"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
              <span className="mt-1 block text-xs text-slate-400">
                Comma-separated — the more specific, the better the tutor match.
              </span>
            </label>

            <div>
              <span className="text-slate-500">Where are you at with it?</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500">What kind of help? (pick any)</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {HELP_TYPES.map((h) => (
                  <Chip
                    key={h.key}
                    active={helpTypes.includes(h.key)}
                    onClick={() => toggleHelpType(h.key)}
                  >
                    {h.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">
                📚 Tutoring only — buddies explain and coach. They can&apos;t do assignments or
                sit assessments for you.
              </p>
            </div>

            <label className="block">
              <span className="text-slate-500">Your goal</span>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Pass the Week 8 midterm / finally get recursion"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            <div>
              <span className="text-slate-500">Format</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <Chip key={f} active={format === f} onClick={() => setFormat(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ---------- Generic task fields ---------- */
          <>
            <label className="block">
              <span className="text-slate-500">What do you need?</span>
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} placeholder="Clean my room before block inspection..." />
            </label>

            <label className="block">
              <span className="text-slate-500">Where</span>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="Hall 9, Blk 51" />
            </label>
          </>
        )}

        <div className="flex gap-2">
          <label className="block flex-1"><span className="text-slate-500">When</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue={isStudy ? 'This week' : 'Today'} /></label>
          <label className="block flex-1"><span className="text-slate-500">Time</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue={isStudy ? '1–2 hrs' : '6–8pm'} /></label>
        </div>

        <label className="block">
          <span className="text-slate-500">{isStudy ? 'Budget (SGD per hour)' : 'Budget (SGD)'}</span>
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
          You pay <b>{formatSgd(cents)}{isStudy ? '/hr' : ''}</b>
        </div>

        <button className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white">
          {isStudy ? 'Post study request' : 'Continue to payment'}
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
