'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatSgd } from '../../../../lib/format';
import { useStore, parseSgdToCents } from '../../../../lib/store';
import { api, ApiClientError } from '../../../../lib/api';

// Create-task form. Posting is FREE and creates the task for real — it goes
// live on the campus feed immediately and every student on campus can offer.
// Inputs are hardened: budget parses safely (no NaN, clamped to S$999), study
// needs a module, and the submit is guarded against double-posts.
const CATEGORIES = ['Room cleaning', 'Laundry pickup', 'Spare home-cooked meal', 'Grocery shopping', 'Food delivery', 'Parcel collection', 'Room shift & storage', 'Study help / tutoring', 'Late-night food run'];
const STORES = ['Any store', '7-Eleven / Prime', 'FairPrice', 'Cheers', 'Amazon / Prime Now'];

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
const WHENS = ['Today', 'This week', 'Flexible'] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
  const { refresh } = useStore();
  const initialCategory = SLUG_TO_CATEGORY[params.get('category') ?? ''] ?? CATEGORIES[0];
  const storeParam = params.get('store');
  const initialStore =
    storeParam === 'convenience' ? '7-Eleven / Prime' : STORES.includes(storeParam ?? '') ? (storeParam as string) : 'Any store';

  const [category, setCategory] = useState(initialCategory);
  const [store, setStore] = useState(initialStore);
  const [budgetRaw, setBudgetRaw] = useState('20');
  const [description, setDescription] = useState('');
  const [where, setWhere] = useState('Hall 9, Blk 51');
  const [when, setWhen] = useState('Today');
  const [time, setTime] = useState('6–8pm');

  // Study-help fields — one typed field (module), rest chips + optional details.
  const [module, setModule] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Intermediate');
  const [helpTypes, setHelpTypes] = useState<string[]>(['concepts']);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[0]);
  const [studyWhen, setStudyWhen] = useState<(typeof WHENS)[number]>('This week');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const [postedId, setPostedId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const cents = parseSgdToCents(budgetRaw);
  const isGrocery = category === 'Grocery shopping' || category === 'Food delivery';
  const isStudy = category === 'Study help / tutoring';
  const missingModule = isStudy && module.trim() === '';
  const invalidBudget = cents <= 0;
  const canPost = !missingModule && !invalidBudget && !posting;

  function toggleHelpType(key: string) {
    setHelpTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function post() {
    if (!canPost || postedId) return; // double-submit guard
    setPosting(true);
    setPostError(null);
    const desc = description.trim();
    // Store preference rides in the description — the buddy needs it, the schema doesn't (yet).
    const fullDesc = isGrocery && store !== 'Any store' ? `[${store}] ${desc}`.trim() : desc;
    try {
      const res = await api.createTask({
        category,
        description: fullDesc || undefined,
        hall: isStudy ? (format === '💻 Online' ? 'Online' : 'Library') : where.trim() || 'On campus',
        when: isStudy ? studyWhen : `${when.trim() || 'Today'} ${time.trim()}`.trim(),
        priceCents: cents,
        ...(isStudy
          ? {
              study: {
                module: module.trim(),
                topics: details.trim() ? [details.trim().slice(0, 80)] : ['See request'],
                level,
                helpTypes: HELP_TYPES.filter((h) => helpTypes.includes(h.key)).map((h) => h.label),
                goal: details.trim() || '—',
                format,
              },
            }
          : {}),
      });
      await refresh(); // home + explore show it immediately
      setPostedId(res.task.id);
    } catch (err) {
      setPostError(err instanceof ApiClientError ? err.message : 'Could not post — check your connection and try again.');
      setPosting(false);
    }
  }

  if (postedId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-xl font-bold">Task posted — for free!</h1>
        <p className="mt-2 max-w-sm text-slate-600">
          It&apos;s live on the marketplace now. You only pay when you accept a buddy — we hold the
          agreed amount and refund anything unused to your balance.
        </p>
        <Link
          href={`/app/applicants/${postedId}`}
          className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white"
        >
          View your task & applicants ›
        </Link>
        <Link href="/app/find" className="mt-3 text-sm text-blue-700">See it in Explore</Link>
        <Link href="/app" className="mt-3 text-sm text-slate-500">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link>
        {isStudy ? 'Get study help' : 'New task'}
      </header>

      <form className="space-y-4 p-4 text-sm" onSubmit={(e) => { e.preventDefault(); post(); }}>
        <label className="block">
          <span className="text-slate-500">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        {isGrocery && (
          <label className="block">
            <span className="text-slate-500">Store</span>
            <select value={store} onChange={(e) => setStore(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
              {STORES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}

        {isStudy ? (
          <>
            <label className="block">
              <span className="text-slate-500">Module & topic</span>
              <input
                value={module}
                onChange={(e) => setModule(e.target.value)}
                maxLength={80}
                placeholder="e.g. MH1810 Calculus — integration, limits"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                autoFocus
              />
            </label>

            <div>
              <span className="text-slate-500">Where are you at?</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Help needed (pick any)</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {HELP_TYPES.map((h) => (
                  <Chip key={h.key} active={helpTypes.includes(h.key)} onClick={() => toggleHelpType(h.key)}>
                    {h.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Where & when</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <Chip key={f} active={format === f} onClick={() => setFormat(f)}>{f}</Chip>
                ))}
                <span className="w-px bg-slate-200" />
                {WHENS.map((w) => (
                  <Chip key={w} active={studyWhen === w} onClick={() => setStudyWhen(w)}>{w}</Chip>
                ))}
              </div>
            </div>

            {showDetails ? (
              <label className="block">
                <span className="text-slate-500">Details (optional)</span>
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={120}
                  placeholder="Goal, specific questions, anything else…"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </label>
            ) : (
              <button type="button" onClick={() => setShowDetails(true)} className="text-xs font-medium text-blue-700">
                + Add details (goal, specific questions)
              </button>
            )}

            <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">
              📚 Tutoring only — buddies explain and coach, never do the work for you.
            </p>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-slate-500">What do you need?</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                rows={3}
                placeholder="Clean my room before block inspection..."
              />
            </label>

            <label className="block">
              <span className="text-slate-500">Where</span>
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                maxLength={60}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            <div className="flex gap-2">
              <label className="block flex-1">
                <span className="text-slate-500">When</span>
                <input value={when} onChange={(e) => setWhen(e.target.value)} maxLength={20} className="mt-1 w-full rounded-xl border px-3 py-2" />
              </label>
              <label className="block flex-1">
                <span className="text-slate-500">Time</span>
                <input value={time} onChange={(e) => setTime(e.target.value)} maxLength={20} className="mt-1 w-full rounded-xl border px-3 py-2" />
              </label>
            </div>
          </>
        )}

        <label className="block">
          <span className="text-slate-500">{isStudy ? 'Budget (SGD per hour)' : 'Budget (SGD)'}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={999}
            step="0.50"
            value={budgetRaw}
            onChange={(e) => setBudgetRaw(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            aria-invalid={invalidBudget}
          />
          <span className="mt-1 block text-xs text-slate-400">
            {invalidBudget
              ? 'Enter a budget above S$0 (max S$999). Buddies can also offer their own price.'
              : 'No minimum — set any budget. Buddies can also offer their own price.'}
          </span>
        </label>

        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          <b>Free to post.</b> Budget {formatSgd(cents)}{isStudy ? '/hr' : ''} — you only pay when
          you accept a buddy. We hold the agreed amount and refund anything unused.
        </div>

        {postError && <p className="text-sm text-red-600">{postError}</p>}

        <button
          type="submit"
          disabled={!canPost}
          className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting
            ? 'Posting…'
            : missingModule
              ? 'Type your module to post'
              : invalidBudget
                ? 'Set a budget to post'
                : isStudy
                  ? 'Post study request (free)'
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
