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

  // Study-help fields — one required typed field (module); the rest are chips
  // with sensible defaults, plus a single optional details line.
  const [module, setModule] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Intermediate');
  const [helpTypes, setHelpTypes] = useState<string[]>(['concepts']);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[0]);
  const [studyWhen, setStudyWhen] = useState('This week');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const [posted, setPosted] = useState(false);

  const cents = Math.round(budget * 100);
  const isGrocery = category === 'Grocery shopping' || category === 'Food delivery';
  const isStudy = category === 'Study help / tutoring';

  function toggleHelpType(key: string) {
    setHelpTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  if (posted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-xl font-bold">Task posted — for free!</h1>
        <p className="mt-2 max-w-sm text-slate-600">
          Verified buddies nearby can now apply and name their price. You only pay when you accept
          one — we hold the agreed amount and refund anything unused to your balance.
        </p>
        <Link
          href="/app/applicants/room-cleaning"
          className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white"
        >
          See applicants &amp; bargain (demo) ›
        </Link>
        <Link href="/app" className="mt-3 text-sm text-slate-500">Back to home</Link>
      </div>
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
          /* ---------- Study request: ONE typed field, everything else chips ---------- */
          <>
            <label className="block">
              <span className="text-slate-500">Module & topic</span>
              <input
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. MH1810 Calculus — integration, limits"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                autoFocus
              />
            </label>

            <div>
              <span className="text-slate-500">Where are you at?</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Help needed (pick any)</span>
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
            </div>

            <div>
              <span className="text-slate-500">Where & when</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <Chip key={f} active={format === f} onClick={() => setFormat(f)}>
                    {f}
                  </Chip>
                ))}
                <span className="w-px bg-slate-200" />
                {['Today', 'This week', 'Flexible'].map((w) => (
                  <Chip key={w} active={studyWhen === w} onClick={() => setStudyWhen(w)}>
                    {w}
                  </Chip>
                ))}
              </div>
            </div>

            {showDetails ? (
              <label className="block">
                <span className="text-slate-500">Details (optional)</span>
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Goal, specific questions, anything else…"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="text-xs font-medium text-blue-700"
              >
                + Add details (goal, specific questions)
              </button>
            )}

            <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">
              📚 Tutoring only — buddies explain and coach, never do the work for you.
            </p>
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

        {!isStudy && (
          <div className="flex gap-2">
            <label className="block flex-1"><span className="text-slate-500">When</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="Today" /></label>
            <label className="block flex-1"><span className="text-slate-500">Time</span><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="6–8pm" /></label>
          </div>
        )}

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

        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          <b>Free to post.</b> Budget {formatSgd(cents)}{isStudy ? '/hr' : ''} — you only pay when
          you accept a buddy. We hold the agreed amount and refund anything unused.
        </div>

        <button
          type="button"
          onClick={() => setPosted(true)}
          disabled={isStudy && module.trim() === ''}
          className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStudy
            ? module.trim() === ''
              ? 'Type your module to post'
              : 'Post study request (free)'
            : 'Post task (free)'}
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
