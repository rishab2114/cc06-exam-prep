'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatSgd } from '../../../../lib/format';
import { parseSgdToCents } from '../../../../lib/store';
import { api, ApiClientError } from '../../../../lib/api';

// Post a freelance gig — a service you'll do for other students at your own
// rate. This is the "customise the job and post the work" flow: you write the
// title, describe exactly what you offer, and set the price. It lists on the
// Services tab; when someone books, it drops into the normal accept/chat flow.
const CATEGORIES = [
  'Room cleaning',
  'Laundry pickup',
  'Spare home-cooked meal',
  'Grocery shopping',
  'Food delivery',
  'Parcel collection',
  'Room shift & storage',
  'Study help / tutoring',
  'Late-night food run',
];

export default function NewServicePage() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[7]); // default to tutoring — the classic student gig
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [where, setWhere] = useState('');
  const [availability, setAvailability] = useState('Weekday evenings');
  const [rateRaw, setRateRaw] = useState('15');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseSgdToCents(rateRaw);
  const missingTitle = title.trim() === '';
  const invalidRate = cents <= 0;
  const canPost = !missingTitle && !invalidRate && !posting;

  async function post() {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      await api.createTask({
        kind: 'OFFER',
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        hall: where.trim() || undefined,
        when: availability.trim() || undefined,
        priceCents: cents,
      });
      router.push('/app/services');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not post — try again.');
      setPosting(false);
    }
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app/services" className="text-slate-500">‹ </Link> Offer a service
      </header>

      <form className="space-y-4 p-4 text-sm" onSubmit={(e) => { e.preventDefault(); post(); }}>
        <label className="block">
          <span className="text-slate-500">Service type</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-slate-500">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. MH1810 calculus tutoring — I got an A"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-slate-500">What you offer</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Describe exactly what you'll do, your experience, what's included…"
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>

        <div className="flex gap-2">
          <label className="block flex-1">
            <span className="text-slate-500">Where (optional)</span>
            <input value={where} onChange={(e) => setWhere(e.target.value)} maxLength={60} placeholder="Library / your hall / online" className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="block flex-1">
            <span className="text-slate-500">Availability</span>
            <input value={availability} onChange={(e) => setAvailability(e.target.value)} maxLength={40} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
        </div>

        <label className="block">
          <span className="text-slate-500">Your rate (SGD)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={999}
            step="0.50"
            value={rateRaw}
            onChange={(e) => setRateRaw(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            aria-invalid={invalidRate}
          />
          <span className="mt-1 block text-xs text-slate-400">
            {invalidRate ? 'Set a rate above S$0 (max S$999).' : 'Bookers can still bargain — this is your starting quote.'}
          </span>
        </label>

        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          <b>Free to list.</b> Your gig shows on the Services tab at {formatSgd(cents)}. When a student
          books it, your quote lands as a pending offer — accept to lock it in and start chatting.
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canPost}
          className="block w-full rounded-xl bg-blue-700 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting ? 'Posting…' : missingTitle ? 'Add a title to post' : invalidRate ? 'Set a rate to post' : 'Post service (free)'}
        </button>
      </form>
    </div>
  );
}
